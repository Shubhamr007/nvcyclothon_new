import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion', 'gsap', 'lenis'],
          forms: ['react-hook-form', 'react-toastify', 'react-confetti'],
          particles: ['@tsparticles/react', '@tsparticles/slim'],
        },
      },
    },
  },
  // Uvicorn is bound to IPv4 locally. Avoid `localhost` resolving to IPv6
  // (`::1`) on some machines, which leaves proxied API calls pending/failing.
  server: { proxy: { '/api': 'http://127.0.0.1:8000', '/upload': 'http://127.0.0.1:8000' } },
});
