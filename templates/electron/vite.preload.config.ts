import { defineConfig } from 'vite';
import { commonAlias } from './vite.common.config';
import { resolve } from 'path';

// https://vitejs.dev/config
export default defineConfig({
   resolve: {
      alias: {
         '@preload': resolve(__dirname, 'src/preload'),
         ...commonAlias,
      },
   },
   build: {
      rollupOptions: {
         output: {
            entryFileNames: 'preload.js',
         },
      },
   },
});
