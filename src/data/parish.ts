import type { IconName } from "../components/ui/icons";

export const address = "V.le della Venezia Giulia 134, 00177 Roma";
export const addressLines = ["V.le della Venezia Giulia 134", "00177 Roma"];
export const neighbourhood = "Prenestino-Labicano";

export const coordinates = { lat: 41.897757, lon: 12.560785 };

export const contact = {
	phone: "06 259 3161",
	phoneHref: "tel:+39062593161",
	email: "smaddolorata@gmail.com",
};

export const parroco = {
	name: "Don Antonio d'Errico",
	email: "antonioderrico66@gmail.com",
};

export const socials: { name: string; href: string; icon: IconName }[] = [
	{ name: "Facebook", href: "https://facebook.com/smaddolorata", icon: "facebook" },
	{ name: "Instagram", href: "https://instagram.com/giovani_addolorata", icon: "instagram" },
	{ name: "YouTube", href: "https://www.youtube.com/channel/UCss8ZJSwWIh7Yj_Lz-9ImMw", icon: "youtube" },
	{ name: "Twitter", href: "https://twitter.com/smaddolorata", icon: "twitter" },
];

// Orari delle SS. Messe nei periodi dell'anno. `months` sono i mesi (1-12) del periodo.
export const massPeriods = [
	{
		id: "inverno",
		label: "Invernale",
		sublabel: "1 set – 30 apr",
		range: "Dal 1° settembre al 30 aprile",
		months: [9, 10, 11, 12, 1, 2, 3, 4],
		festive: ["8:00", "9:00", "10:00", "11:00", "12:00", "18:00"],
		feriali: ["9:00", "10:00", "18:00"],
	},
	{
		id: "primavera",
		label: "Maggio – giugno",
		sublabel: "1 mag – 30 giu",
		range: "Dal 1° maggio al 30 giugno",
		months: [5, 6],
		festive: ["8:00", "9:00", "10:00", "11:00", "12:00", "19:00"],
		feriali: ["9:00", "10:00", "19:00"],
	},
	{
		id: "luglio",
		label: "Luglio",
		sublabel: "1 – 31 lug",
		range: "Dal 1° al 31 luglio",
		months: [7],
		festive: ["8:00", "9:00", "10:00", "11:00", "19:00"],
		feriali: ["9:00", "19:00"],
	},
	{
		id: "agosto",
		label: "Agosto",
		sublabel: "1 – 31 ago",
		range: "Dal 1° al 31 agosto",
		months: [8],
		festive: ["8:00", "9:00", "11:00", "19:00"],
		feriali: ["9:00", "19:00"],
	},
];

export const rosario = ["18:30"];
export const vespri = ["19:30"];
export const segreteria = { times: ["17:00 – 19:00"], days: "Da lunedì a sabato" };

export function massPeriodFor(month: number) {
	return massPeriods.find((p) => p.months.includes(month)) ?? massPeriods[0];
}
