import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** JSX in `.js` is skipped by Vite's default pipeline (esbuild excludes `.js`). Transform before Rollup. */
function esbuildJsxInProjectJs() {
  const srcRoot = path.resolve(__dirname, 'src');
  return {
    name: 'vite:esbuild-jsx-in-src-js',
    enforce: 'pre',
    async transform(code, id) {
      const file = path.normalize(id.split('?')[0]);
      if (!file.endsWith('.js')) return;
      const rel = path.relative(srcRoot, file);
      if (rel.startsWith('..') || path.isAbsolute(rel)) return;

      const result = await esbuild.transform(code, {
        loader: 'jsx',
        jsx: 'automatic',
        sourcefile: file,
        sourcemap: true,
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [esbuildJsxInProjectJs(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    target: 'es2020',
    chunkSizeWarningLimit: 650,
    /** Smaller parse cost + less main-thread time in Lighthouse */
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none',
    },
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'framer-motion';
          if (id.includes('@mui/x-date-pickers')) return 'mui-x-pickers';
          if (id.includes('@mui/icons-material')) return 'mui-icons';
          if (id.includes('@mui')) return 'mui-core';
          if (id.includes('lucide-react')) return 'lucide';
          if (id.includes('emoji-picker-react')) return 'emoji-picker';
          if (id.includes('date-fns')) return 'date-fns';
          /* Keep axios + socket with vendor — splitting them caused Rollup circular chunk warnings */
          if (id.includes('react-router')) return 'react-router';
          /* Leave react + react-dom in vendor — splitting caused circular chunk graphs */
          return 'vendor';
        },
      },
    },
  },
  publicDir: 'public',
});
