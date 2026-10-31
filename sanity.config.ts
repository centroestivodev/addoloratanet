import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {colorInput} from '@sanity/color-input'
import {schemaTypes} from './src/sanity/schemaTypes/index'
import {dataset, projectId} from './src/sanity/env'

export default defineConfig({
  name: 'addoloratanet',
  title: 'addoloratanet',
  projectId,
  dataset,
  plugins: [structureTool(), colorInput()],
  schema: {
    types: schemaTypes,
  },
})