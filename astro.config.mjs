// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

import sanity from "@sanity/astro";
import react from "@astrojs/react";
import vue from "@astrojs/vue";
import netlify from "@astrojs/netlify";
import { rm } from "node:fs/promises";

// Il FantaSantiago esiste solo in sviluppo (`npm run dev`): la pagina non entra
// nella build e le foto dei partecipanti (public/avatars) vengono tolte dall'output
// pubblicato, quindi sul sito online /fantasantiago risponde con la pagina 404.
//
// Per rimetterlo online:
//   1. sposta src/dev/fantasantiago.astro in src/pages/fantasantiago.astro
//      (gli import relativi restano validi, la cartella è allo stesso livello);
//   2. togli `fantasantiagoSoloInDev` dalla lista `integrations` qui sotto
//      (o cancella questo blocco), così anche public/avatars torna pubblicato;
//   3. controlla che su Netlify siano impostate PUBLIC_SHEET_ANAGRAFICA_URL e
//      PUBLIC_SHEET_PUNTI_URL, i fogli da cui la classifica legge i dati.
/** @type {import('astro').AstroIntegration} */
const fantasantiagoSoloInDev = {
	name: "fantasantiago-solo-in-dev",
	hooks: {
		"astro:config:setup": ({ command, injectRoute }) => {
			if (command === "dev") {
				injectRoute({ pattern: "/fantasantiago", entrypoint: "./src/dev/fantasantiago.astro" });
			}
		},
		"astro:build:done": async ({ dir }) => {
			await rm(new URL("avatars/", dir), { recursive: true, force: true });
		},
	},
};

// https://astro.build/config
export default defineConfig({
  vite: {
      plugins: [tailwindcss()]
	},

  adapter: netlify(),

  integrations: [sanity({
	projectId: 'bomj2fjw',
	dataset: 'addoloratanet',
	useCdn: false,
	studioBasePath: '/admin'
  }), react(), vue(), fantasantiagoSoloInDev]
});