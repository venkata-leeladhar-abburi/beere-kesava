// vitest.config.ts
import { defineConfig } from "file:///C:/Users/RAVIKIRAN/Downloads/beere-kesava/frontend/node_modules/vitest/dist/config.js";
import path from "path";
import react from "file:///C:/Users/RAVIKIRAN/Downloads/beere-kesava/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\RAVIKIRAN\\Downloads\\beere-kesava\\frontend";
var vitest_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // e2e/ holds Playwright specs, run only by `npm run test:e2e` — without
    // this, Vitest's default *.spec.ts glob also picks them up and fails
    // immediately on Playwright-only APIs like test.describe.configure().
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "src/imports/**",
        // Vendored shadcn/ui primitives — upstream-maintained, not app logic.
        // App-authored files in shared/ui/ use PascalCase and stay covered.
        "src/shared/ui/{accordion,alert-dialog,alert,aspect-ratio,avatar,badge,breadcrumb,button,calendar,card,carousel,chart,checkbox,collapsible,command,context-menu,dialog,drawer,dropdown-menu,form,hover-card,input-otp,input,label,menubar,navigation-menu,pagination,popover,progress,radio-group,resizable,scroll-area,select,separator,sheet,sidebar-components,sidebar-context,sidebar,skeleton,slider,sonner,switch,table,tabs,textarea,toggle-group,toggle,tooltip,use-mobile,utils}.{ts,tsx}"
      ]
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFJBVklLSVJBTlxcXFxEb3dubG9hZHNcXFxcYmVlcmUta2VzYXZhXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxSQVZJS0lSQU5cXFxcRG93bmxvYWRzXFxcXGJlZXJlLWtlc2F2YVxcXFxmcm9udGVuZFxcXFx2aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9SQVZJS0lSQU4vRG93bmxvYWRzL2JlZXJlLWtlc2F2YS9mcm9udGVuZC92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICB0ZXN0OiB7XHJcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBzZXR1cEZpbGVzOiBbJy4vc3JjL3Rlc3Qvc2V0dXAudHMnXSxcclxuICAgIGNzczogZmFsc2UsXHJcbiAgICAvLyBlMmUvIGhvbGRzIFBsYXl3cmlnaHQgc3BlY3MsIHJ1biBvbmx5IGJ5IGBucG0gcnVuIHRlc3Q6ZTJlYCBcdTIwMTQgd2l0aG91dFxyXG4gICAgLy8gdGhpcywgVml0ZXN0J3MgZGVmYXVsdCAqLnNwZWMudHMgZ2xvYiBhbHNvIHBpY2tzIHRoZW0gdXAgYW5kIGZhaWxzXHJcbiAgICAvLyBpbW1lZGlhdGVseSBvbiBQbGF5d3JpZ2h0LW9ubHkgQVBJcyBsaWtlIHRlc3QuZGVzY3JpYmUuY29uZmlndXJlKCkuXHJcbiAgICBleGNsdWRlOiBbJyoqL25vZGVfbW9kdWxlcy8qKicsICcqKi9kaXN0LyoqJywgJ2UyZS8qKiddLFxyXG4gICAgY292ZXJhZ2U6IHtcclxuICAgICAgcHJvdmlkZXI6ICd2OCcsXHJcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnaHRtbCddLFxyXG4gICAgICBleGNsdWRlOiBbXHJcbiAgICAgICAgJ25vZGVfbW9kdWxlcy8nLFxyXG4gICAgICAgICdzcmMvdGVzdC8nLFxyXG4gICAgICAgICcqKi8qLmQudHMnLFxyXG4gICAgICAgICcqKi8qLmNvbmZpZy4qJyxcclxuICAgICAgICAnc3JjL2ltcG9ydHMvKionLFxyXG4gICAgICAgIC8vIFZlbmRvcmVkIHNoYWRjbi91aSBwcmltaXRpdmVzIFx1MjAxNCB1cHN0cmVhbS1tYWludGFpbmVkLCBub3QgYXBwIGxvZ2ljLlxyXG4gICAgICAgIC8vIEFwcC1hdXRob3JlZCBmaWxlcyBpbiBzaGFyZWQvdWkvIHVzZSBQYXNjYWxDYXNlIGFuZCBzdGF5IGNvdmVyZWQuXHJcbiAgICAgICAgJ3NyYy9zaGFyZWQvdWkve2FjY29yZGlvbixhbGVydC1kaWFsb2csYWxlcnQsYXNwZWN0LXJhdGlvLGF2YXRhcixiYWRnZSxicmVhZGNydW1iLGJ1dHRvbixjYWxlbmRhcixjYXJkLGNhcm91c2VsLGNoYXJ0LGNoZWNrYm94LGNvbGxhcHNpYmxlLGNvbW1hbmQsY29udGV4dC1tZW51LGRpYWxvZyxkcmF3ZXIsZHJvcGRvd24tbWVudSxmb3JtLGhvdmVyLWNhcmQsaW5wdXQtb3RwLGlucHV0LGxhYmVsLG1lbnViYXIsbmF2aWdhdGlvbi1tZW51LHBhZ2luYXRpb24scG9wb3Zlcixwcm9ncmVzcyxyYWRpby1ncm91cCxyZXNpemFibGUsc2Nyb2xsLWFyZWEsc2VsZWN0LHNlcGFyYXRvcixzaGVldCxzaWRlYmFyLWNvbXBvbmVudHMsc2lkZWJhci1jb250ZXh0LHNpZGViYXIsc2tlbGV0b24sc2xpZGVyLHNvbm5lcixzd2l0Y2gsdGFibGUsdGFicyx0ZXh0YXJlYSx0b2dnbGUtZ3JvdXAsdG9nZ2xlLHRvb2x0aXAsdXNlLW1vYmlsZSx1dGlsc30ue3RzLHRzeH0nLFxyXG4gICAgICBdLFxyXG4gICAgfSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdWLFNBQVMsb0JBQW9CO0FBQ3JYLE9BQU8sVUFBVTtBQUNqQixPQUFPLFdBQVc7QUFGbEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxJQUNsQyxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJTCxTQUFTLENBQUMsc0JBQXNCLGNBQWMsUUFBUTtBQUFBLElBQ3RELFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLE1BQU07QUFBQSxNQUN6QixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQTtBQUFBO0FBQUEsUUFHQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
