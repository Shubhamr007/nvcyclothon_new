import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';

const resolveFromRoot = (relativePath) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolveFromRoot('./src'),
      react: resolveFromRoot('./node_modules/react'),
      'react-dom': resolveFromRoot('./node_modules/react-dom'),
    },
    // Force a single copy of React across all packages (framer-motion,
    // @react-three/fiber, @splinetool/react-spline, etc.) to prevent
    // the "Invalid hook call" / duplicate-React crash.
    dedupe: ['react', 'react-dom', 'react-dom/client'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'framer-motion',
      'gsap',
      'swiper',
      'swiper/react',
      'swiper/modules',
      'react-countup',
      'react-intersection-observer',
      'react-icons/fa6',
      'react-icons/md',
      'lucide-react',
      'lenis',
      'clsx',
      'tailwind-merge',
      'qrcode.react',
      'react-confetti',
      'react-hook-form',
      'react-toastify',
      'class-variance-authority',
      '@radix-ui/react-slot',
      '@tsparticles/react',
      '@tsparticles/slim',
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
