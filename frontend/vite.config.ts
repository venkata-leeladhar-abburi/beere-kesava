import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own cacheable chunks so an
        // app-code deploy doesn't force users to re-download React/Radix/etc.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Radix calls React.forwardRef at module-load time, so it must be
          // bundled with React rather than split into its own chunk — Rollup
          // doesn't guarantee vendor-react finishes evaluating before a
          // separate vendor-radix chunk runs, which crashes with
          // "Cannot read properties of undefined (reading 'forwardRef')".
          if (/react-router|\/react\/|\/react-dom\/|@radix-ui/.test(id)) return 'vendor-react'
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('xlsx')) return 'vendor-xlsx'
          if (id.includes('lucide-react') || id.includes('@phosphor-icons')) return 'vendor-icons'
          if (id.includes('motion')) return 'vendor-motion'
          return 'vendor'
        },
      },
    },
  },
})
