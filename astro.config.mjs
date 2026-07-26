// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

import sanity from "@sanity/astro";
import react from "@astrojs/react";
import vue from "@astrojs/vue";
import netlify from "@astrojs/netlify";

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
  }), react(), vue()]
});