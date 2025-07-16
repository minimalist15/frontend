import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'ngraph.forcelayout', 
      'ngraph.graph', 
      'prop-types',
      'react-force-graph',
      'd3-force',
      'd3-drag',
      'd3-zoom',
      'three'
    ],
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-force-graph': ['react-force-graph'],
          'd3': ['d3-force', 'd3-drag', 'd3-zoom'],
          'ngraph': ['ngraph.forcelayout', 'ngraph.graph'],
          'three': ['three']
        }
      }
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  define: {
    // Prevent multiple Three.js instances
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
});
