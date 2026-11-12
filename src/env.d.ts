/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

interface ImportMetaEnv {
	readonly PUBLIC_SHEET_ANAGRAFICA_URL: string;
	readonly PUBLIC_SHEET_PUNTI_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Il worker di pdf.js non ha tipi propri
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs'
