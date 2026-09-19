import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { collectionPoints } from './src/data/collection-points.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'validate-collection-points',
    buildStart() {
      // A importação valida o schema e as referências. Dados inválidos impedem o build.
      if (!collectionPoints.some(point => point.verification.status === 'verified')) {
        this.error('O cadastro precisa de pelo menos um ponto verificado.')
      }
    },
  }],
})
