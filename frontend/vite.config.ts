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
        // No manual vendor chunk splitting: many UI libraries here (Radix,
        // react-hook-form, cmdk, sonner, vaul, recharts, ...) call
        // React.forwardRef/createContext at module-load time. Grouping them
        // into hand-picked chunks by id pattern breaks Rollup's guarantee
        // that a chunk's dependencies finish evaluating before it runs,
        // causing "Cannot read properties of undefined (reading
        // 'forwardRef'/'createContext')" crashes whenever a split-off chunk
        // happens to execute before vendor-react. Letting Rollup's default
        // chunking control the full dependency graph keeps load order
        // correct; it still splits vendor code, just without hand-drawn
        // boundaries that can sever a load-order-critical edge.
      },
    },
  },
})
