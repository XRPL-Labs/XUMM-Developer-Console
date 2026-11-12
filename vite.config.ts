import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // VUE_APP_XUMM_KEY: the key name of the legacy (Vue CLI) console, so an existing .env keeps working
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __XUMM_KEY__: JSON.stringify(env.VITE_XUMM_KEY || env.VUE_APP_XUMM_KEY || ''),
      __API_ENDPOINT__: JSON.stringify(env.VITE_API_ENDPOINT || 'https://xumm.app/api/v1/'),
    },
    // :8080 is the local origin the Xaman API (CORS) and the console's OAuth2 client know
    server: { port: 8080, strictPort: true },
    preview: { port: 8080, strictPort: true },
  }
})
