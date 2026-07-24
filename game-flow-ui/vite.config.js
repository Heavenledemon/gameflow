import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function compressedUnityAssets() {
  return {
    name: 'compressed-unity-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const filePath = request.url?.split('?')[0] ?? ''
        if (filePath.endsWith('.br')) response.setHeader('Content-Encoding', 'br')
        if (filePath.endsWith('.gz') || filePath.endsWith('.unityweb')) response.setHeader('Content-Encoding', 'gzip')
        if (filePath.endsWith('.wasm.br') || filePath.endsWith('.wasm.gz') || filePath.endsWith('.wasm.unityweb')) response.setHeader('Content-Type', 'application/wasm')
        if (filePath.endsWith('.js.br') || filePath.endsWith('.js.gz') || filePath.endsWith('.js.unityweb')) response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [react(), compressedUnityAssets()],
  server: {
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return
            console.error('Proxy error:', err)
          })
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err) => {
              if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return
            })
          })
        },
      },
    },
  },
}))
