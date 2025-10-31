import { defineConfig } from 'tsup';
import fs from 'fs-extra';
import path from 'path';

export default defineConfig({
   entry: ['src/cli.ts', 'src/index.ts'],
   format: ['cjs'],
   dts: true,
   clean: true,
   shims: true,
   onSuccess: async () => {
      // 复制 resources 目录到 dist，保持目录结构
      fs.copySync(path.resolve('resources'), path.resolve('dist/resources'), {
         overwrite: true,
      });

      // 复制 templates 目录到 dist
      fs.copySync(path.resolve('templates'), path.resolve('dist/templates'), {
         overwrite: true,
      });
   },
});
