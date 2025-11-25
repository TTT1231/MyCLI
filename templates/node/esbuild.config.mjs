import { build } from 'esbuild';
import { rmSync, existsSync } from 'fs';

// 自定义打包配置
const buildOption = {
   //输出目录
   outdir: 'dist',
   //是否输出在一个文件中，默认为true输出index.js
   //否则就是输出多文件.js
   isOutputSingleFile: true,
};

// 先清空 dist 目录
if (existsSync(buildOption.outdir)) {
   rmSync(buildOption.outdir, { recursive: true });
}

// esbuild 配置
await build({
   entryPoints: buildOption.isOutputSingleFile ? ['src/main.ts'] : ['src/**/*.ts'],
   bundle: buildOption.isOutputSingleFile,
   platform: 'node',
   target: 'node18',
   format: 'esm',
   outdir: buildOption.isOutputSingleFile ? undefined : buildOption.outdir,
   outfile: buildOption.isOutputSingleFile ? 'dist/index.js' : undefined,
   sourcemap: true,
   minify: false,
   external: ['express', 'fs', 'path', 'url'],
})
   .then(() => {
      console.log('✅ 构建成功!');
   })
   .catch(() => {
      console.error('❌ 构建失败!');
      process.exit(1);
   });
