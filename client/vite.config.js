import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';

const resolveFromRoot = (relativePath) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: resolveFromRoot('./node_modules/react'),
      'react-dom': resolveFromRoot('./node_modules/react-dom'),
    },
    // Force a single copy of React across all packages (framer-motion,
    // @react-three/fiber, @splinetool/react-spline, etc.) to prevent
    // the "Invalid hook call" / duplicate-React crash.
    dedupe: ['react', 'react-dom', 'react-dom/client'],
  },
  optimizeDeps: {
    // Explicitly include framer-motion with React in the same first-pass
    // pre-bundle so they share one React instance. Without this, Vite can
    // run a second optimisation pass later (triggered by @react-three/fiber
    // or @splinetool/react-spline discovery) that creates a split React copy,
    // which breaks all hooks inside framer-motion components.
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
    ],
  },
  // Keep HMR socket deterministic to avoid localhost/undefined fallback URLs.
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
      clientPort: 5173,
      protocol: 'ws',
    },
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/upload': 'http://127.0.0.1:8000',
    },
  },
});
