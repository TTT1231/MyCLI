import { defineConfig } from 'vite';
import { resolve } from 'path';
import { commonAlias } from './vite.common.config';
// https://vitejs.dev/config
export default defineConfig({
   resolve: {
      alias: {
         '@main': resolve(__dirname, 'src/main'),
         ...commonAlias,
      },
   },
   build: {
      rollupOptions: {
         output: {
            entryFileNames: 'main.js',
         },
      },
   },
});
