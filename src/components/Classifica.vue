<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import Papa from "papaparse";

interface Regola {
	titolo: string;
	descrizione: string;
	punteggio: number;
}

interface EventoGiorno {
	regolaTitolo: string;
	descrizione: string;
	punteggio: number;
}

interface GruppoData {
	data: string;
	eventi: EventoGiorno[];
	subtotale: number;
}

interface PersonaClassifica {
	id: string;
	nome: string;
	immagine: string;
	totalPoints: number;
	eventsByDate: GruppoData[];
	position: number;
}

const POLL_INTERVAL_MS = 2 * 60 * 1000;

const anagraficaUrl = import.meta.env.PUBLIC_SHEET_ANAGRAFICA_URL;
const puntiUrl = import.meta.env.PUBLIC_SHEET_PUNTI_URL;

const loading = ref(true);
const loadError = ref<string | null>(null);
const hasLoadedOnce = ref(false);
const classifica = ref<PersonaClassifica[]>([]);
const regole = ref<Regola[]>([]);
const expandedIds = reactive(new Set<string>());
const activeTab = ref<"classifica" | "regolamento">("classifica");

const isEmpty = computed(
	() => hasLoadedOnce.value && !loadError.value && classifica.value.length === 0
);
const isRegolamentoEmpty = computed(
	() => hasLoadedOnce.value && !loadError.value && regole.value.length === 0
);

let intervalId: ReturnType<typeof setInterval> | undefined;

function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function formatPoints(points: number): string {
	if (points > 0) return `+${points}`;
	return String(points);
}

function formatDate(isoDate: string): string {
	const parsed = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return isoDate;
	return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(
		parsed
	);
}

async function fetchCsvRows(url: string): Promise<Record<string, string>[]> {
	if (!url) {
		throw new Error("URL del foglio non configurato");
	}
	const separator = url.includes("?") ? "&" : "?";
	const response = await fetch(`${url}${separator}_t=${Date.now()}`);
	if (!response.ok) {
		throw new Error(`Richiesta fallita (${response.status})`);
	}
	const text = await response.text();
	const result = Papa.parse<Record<string, string>>(text, {
		header: true,
		skipEmptyLines: true,
	});
	return result.data;
}

function parseAnagrafica(rows: Record<string, string>[]) {
	const regole = new Map<string, Regola>();
	const persone: { nome: string; immagine: string }[] = [];
	const seenNomi = new Set<string>();

	for (const row of rows) {
		const titolo = (row.regola_titolo ?? "").trim();
		if (titolo) {
			regole.set(titolo, {
				titolo,
				descrizione: (row.regola_descrizione ?? "").trim(),
				punteggio: Number(row.regola_punteggio) || 0,
			});
		}

		const nome = (row.persona_nome_cognome ?? "").trim();
		if (nome && !seenNomi.has(nome)) {
			seenNomi.add(nome);
			persone.push({ nome, immagine: (row.persona_immagine ?? "").trim() });
		}
	}

	return { regole, persone };
}

function parsePunti(rows: Record<string, string>[]) {
	return rows
		.map((row) => ({
			data: (row.data ?? "").trim(),
			persona: (row.persona ?? "").trim(),
			regola: (row.regola ?? "").trim(),
		}))
		.filter((row) => row.persona && row.regola);
}

function buildClassifica(
	persone: { nome: string; immagine: string }[],
	regole: Map<string, Regola>,
	punti: { data: string; persona: string; regola: string }[]
): PersonaClassifica[] {
	const byName = new Map<
		string,
		{ nome: string; immagine: string; totalPoints: number; giorni: Map<string, EventoGiorno[]> }
	>();

	for (const persona of persone) {
		byName.set(persona.nome, {
			nome: persona.nome,
			immagine: persona.immagine,
			totalPoints: 0,
			giorni: new Map(),
		});
	}

	for (const punto of punti) {
		const persona = byName.get(punto.persona);
		if (!persona) {
			console.warn("Punto orfano: persona non trovata in anagrafica ->", punto.persona);
			continue;
		}
		const regola = regole.get(punto.regola);
		if (!regola) {
			console.warn("Punto orfano: regola non trovata in anagrafica ->", punto.regola);
			continue;
		}

		persona.totalPoints += regola.punteggio;
		if (!persona.giorni.has(punto.data)) {
			persona.giorni.set(punto.data, []);
		}
		persona.giorni.get(punto.data)!.push({
			regolaTitolo: regola.titolo,
			descrizione: regola.descrizione,
			punteggio: regola.punteggio,
		});
	}

	const lista = Array.from(byName.values()).map((persona) => {
		const eventsByDate: GruppoData[] = Array.from(persona.giorni.entries())
			.sort((a, b) => b[0].localeCompare(a[0]))
			.map(([data, eventi]) => ({
				data,
				eventi,
				subtotale: eventi.reduce((sum, e) => sum + e.punteggio, 0),
			}));

		return {
			id: slugify(persona.nome),
			nome: persona.nome,
			immagine: persona.immagine,
			totalPoints: persona.totalPoints,
			eventsByDate,
			position: 0,
		};
	});

	lista.sort((a, b) => b.totalPoints - a.totalPoints);

	let position = 0;
	let previousPoints: number | null = null;
	lista.forEach((persona, index) => {
		if (previousPoints === null || persona.totalPoints !== previousPoints) {
			position = index + 1;
		}
		persona.position = position;
		previousPoints = persona.totalPoints;
	});

	return lista;
}

async function loadData(isBackground = false) {
	if (!isBackground) {
		loading.value = !hasLoadedOnce.value;
		loadError.value = null;
	}

	try {
		const [anagraficaRows, puntiRows] = await Promise.all([
			fetchCsvRows(anagraficaUrl),
			fetchCsvRows(puntiUrl),
		]);

		const { regole: regoleMap, persone } = parseAnagrafica(anagraficaRows);
		const punti = parsePunti(puntiRows);

		classifica.value = buildClassifica(persone, regoleMap, punti);
		regole.value = Array.from(regoleMap.values()).sort((a, b) => b.punteggio - a.punteggio);
		loadError.value = null;
		hasLoadedOnce.value = true;
	} catch (err) {
		console.error("Errore nel caricamento della classifica:", err);
		if (!hasLoadedOnce.value) {
			loadError.value = err instanceof Error ? err.message : "Errore sconosciuto";
		}
	} finally {
		loading.value = false;
	}
}

function toggle(id: string) {
	if (expandedIds.has(id)) {
		expandedIds.delete(id);
	} else {
		expandedIds.add(id);
	}
}

onMounted(() => {
	loadData();
	intervalId = setInterval(() => loadData(true), POLL_INTERVAL_MS);
});

onUnmounted(() => {
	if (intervalId) clearInterval(intervalId);
});
</script>

<template>
	<div class="flex flex-col gap-4">
		<div v-if="loading" class="flex flex-col gap-3" aria-live="polite" aria-busy="true">
			<div v-for="n in 5" :key="n" class="skeleton h-16 w-full rounded-box"></div>
		</div>

		<div v-else-if="loadError" role="alert" class="alert alert-error flex-col items-start gap-3 sm:flex-row sm:items-center">
			<span>Non è stato possibile caricare la classifica: {{ loadError }}</span>
			<button type="button" class="btn btn-sm" @click="loadData()">Riprova</button>
		</div>

		<template v-else>
			<div role="tablist" class="tabs tabs-boxed w-fit">
				<button
					role="tab"
					type="button"
					class="tab"
					:class="{ 'tab-active': activeTab === 'classifica' }"
					@click="activeTab = 'classifica'"
				>
					Classifica
				</button>
				<button
					role="tab"
					type="button"
					class="tab"
					:class="{ 'tab-active': activeTab === 'regolamento' }"
					@click="activeTab = 'regolamento'"
				>
					Regolamento
				</button>
			</div>

			<div v-if="activeTab === 'classifica'">
				<div v-if="isEmpty" class="alert flex-col items-start gap-1">
					<span class="font-semibold">Nessun dato disponibile</span>
					<span class="text-sm text-base-content/70">I fogli non contengono ancora persone o punteggi.</span>
				</div>

				<ul v-else class="flex flex-col gap-3">
			<li v-for="persona in classifica" :key="persona.id" class="rounded-box bg-base-200">
				<button
					type="button"
					:id="`classifica-toggle-${persona.id}`"
					:aria-expanded="expandedIds.has(persona.id)"
					:aria-controls="`classifica-panel-${persona.id}`"
					class="flex w-full items-center gap-4 p-4 text-left"
					@click="toggle(persona.id)"
				>
					<span class="w-8 shrink-0 text-center text-lg font-bold text-base-content/60">{{ persona.position }}</span>

					<img
						:src="persona.immagine || undefined"
						:alt="`Avatar di ${persona.nome}`"
						loading="lazy"
						class="h-12 w-12 shrink-0 rounded-full object-cover bg-base-300"
					/>

					<span class="flex-1 font-semibold">{{ persona.nome }}</span>

					<span
						class="w-16 shrink-0 text-right text-lg font-bold"
						:class="persona.totalPoints < 0 ? 'text-error' : 'text-success'"
					>
						{{ formatPoints(persona.totalPoints) }}
					</span>

					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 shrink-0 transition-transform"
						:class="{ 'rotate-180': expandedIds.has(persona.id) }"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				<Transition name="expand">
					<div
						v-if="expandedIds.has(persona.id)"
						:id="`classifica-panel-${persona.id}`"
						role="region"
						:aria-labelledby="`classifica-toggle-${persona.id}`"
						class="px-4 pb-4"
					>
						<p v-if="persona.eventsByDate.length === 0" class="text-sm text-base-content/60">
							Nessun punto assegnato
						</p>
						<div v-else class="flex flex-col gap-4 border-t border-base-content/10 pt-3">
							<div v-for="giorno in persona.eventsByDate" :key="giorno.data">
								<div class="mb-1 flex items-center justify-between">
									<span class="text-sm font-semibold text-base-content/70">{{ formatDate(giorno.data) }}</span>
									<span
										class="badge badge-sm"
										:class="giorno.subtotale < 0 ? 'badge-error' : 'badge-success'"
									>
										{{ formatPoints(giorno.subtotale) }}
									</span>
								</div>
								<ul class="flex flex-col gap-1.5">
									<li
										v-for="(evento, index) in giorno.eventi"
										:key="index"
										class="flex items-start justify-between gap-3 rounded-lg bg-base-100 px-3 py-2 text-sm"
									>
										<span>
											<span class="font-medium">{{ evento.regolaTitolo }}</span>
											<span v-if="evento.descrizione" class="block text-base-content/60">{{ evento.descrizione }}</span>
										</span>
										<span
											class="shrink-0 font-semibold"
											:class="evento.punteggio < 0 ? 'text-error' : 'text-success'"
										>
											{{ formatPoints(evento.punteggio) }}
										</span>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</Transition>
			</li>
				</ul>
			</div>

			<div v-else>
				<div v-if="isRegolamentoEmpty" class="alert flex-col items-start gap-1">
					<span class="font-semibold">Nessuna regola disponibile</span>
					<span class="text-sm text-base-content/70">Il foglio anagrafica non contiene ancora regole.</span>
				</div>

				<ul v-else class="flex flex-col gap-3">
					<li
						v-for="regola in regole"
						:key="regola.titolo"
						class="flex items-start justify-between gap-3 rounded-box bg-base-200 p-4"
					>
						<span>
							<span class="font-semibold">{{ regola.titolo }}</span>
							<span v-if="regola.descrizione" class="block text-sm text-base-content/60">{{ regola.descrizione }}</span>
						</span>
						<span
							class="badge shrink-0"
							:class="regola.punteggio < 0 ? 'badge-error' : 'badge-success'"
						>
							{{ formatPoints(regola.punteggio) }}
						</span>
					</li>
				</ul>
			</div>
		</template>
	</div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
	transition: grid-template-rows 0.2s ease, opacity 0.2s ease;
	display: grid;
	grid-template-rows: 1fr;
	overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
	grid-template-rows: 0fr;
	opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
	grid-template-rows: 1fr;
	opacity: 1;
}
.expand-enter-active > *,
.expand-leave-active > * {
	min-height: 0;
}

@media (prefers-reduced-motion: reduce) {
	.expand-enter-active,
	.expand-leave-active {
		transition: none;
	}
}
</style>
