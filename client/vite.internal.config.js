import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';

const resolveFromRoot = (relativePath) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const internalEntryPlugin = {
  name: 'internal-entry',
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      if (request.url === '/' || request.url === '/index.html') {
        request.url = '/internal.html';
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), internalEntryPlugin],
  resolve: {
    alias: {
      react: resolveFromRoot('./node_modules/react'),
      'react-dom': resolveFromRoot('./node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-dom/client'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
  build: {
    outDir: 'dist-internal',
    rollupOptions: {
      input: {
        internal: resolveFromRoot('./internal.html'),
      },
    },
  },
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
    hmr: {
      host: 'localhost',
      clientPort: 5174,
      protocol: 'ws',
    },
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/upload': 'http://127.0.0.1:8000',
    },
  },
});
