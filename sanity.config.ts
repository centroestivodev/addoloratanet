import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {colorInput} from '@sanity/color-input'
import {schemaTypes} from './src/sanity/schemaTypes/index'

export default defineConfig({
  name: 'addoloratanet',
  title: 'addoloratanet',
  projectId: 'bomj2fjw',
  dataset: 'addoloratanet',
  plugins: [structureTool(), colorInput()],
  schema: {
    types: schemaTypes,
  },
})