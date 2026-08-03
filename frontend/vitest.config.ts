import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/imports/**',
        // Vendored shadcn/ui primitives — upstream-maintained, not app logic.
        // App-authored files in shared/ui/ use PascalCase and stay covered.
        'src/shared/ui/{accordion,alert-dialog,alert,aspect-ratio,avatar,badge,breadcrumb,button,calendar,card,carousel,chart,checkbox,collapsible,command,context-menu,dialog,drawer,dropdown-menu,form,hover-card,input-otp,input,label,menubar,navigation-menu,pagination,popover,progress,radio-group,resizable,scroll-area,select,separator,sheet,sidebar-components,sidebar-context,sidebar,skeleton,slider,sonner,switch,table,tabs,textarea,toggle-group,toggle,tooltip,use-mobile,utils}.{ts,tsx}',
      ],
    },
  },
})
