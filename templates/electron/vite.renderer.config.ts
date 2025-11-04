import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { commonAlias } from './vite.common.config';
import { resolve } from 'path';
import vueDevTools from 'vite-plugin-vue-devtools';


// https://vitejs.dev/config
export default defineConfig({
   plugins: [vue(), vueDevTools()],
   resolve: {
      alias: {
         '@renderer': resolve(__dirname, 'src/renderer'),
         ...commonAlias,
      },
   },
   publicDir: 'resources/public',
   server: {
      port: 5173,
   },
});
