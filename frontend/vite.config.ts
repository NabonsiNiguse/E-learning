import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Router code-gen must come before React
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // Reads path aliases from tsconfig.json (the @/* → ./src/* mapping)
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      // Explicit fallback in case vite-tsconfig-paths doesn't pick it up
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,

    allowedHosts: [
      "labored-passably-dividend.ngrok-free.dev"
    ],
  },
})