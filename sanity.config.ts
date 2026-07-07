import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './src/sanity/schemaTypes/index'

export default defineConfig({
  name: 'addoloratanet',
  title: 'addoloratanet',
  projectId: 'bomj2fjw',
  dataset: 'addoloratanet',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})