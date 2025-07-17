import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react-force-graph',
      'd3-force',
      'd3-drag',
      'd3-zoom',
      'd3'
    ],
    exclude: ['lucide-react', 'three'],
  },
  build: {
    target: 'es2015',
    sourcemap: false,
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          'd3': ['d3', 'd3-force', 'd3-drag', 'd3-zoom'],
          'force-graph': ['react-force-graph']
        }
      }
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  esbuild: {
    target: 'es2015'
  }
});
