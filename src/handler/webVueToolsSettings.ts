import path from 'path';

import {
   //base file ops
   writePackageJson,
   copyDir,
   copyDirWithSelf,
   copyDirWithRename,
   readTextFileContent,
   writeTextFile,
   //git ops
   createGitOpsInstance,
   //main file ops
   MainFileOps,
   //package.json ops
   appendRecordToRecord,
   readPackageJson,
   //tailwindcss file ops
   putInTailwindCssFileGenerate,
   //tsconfig file ops
   TsconfigOps,
   //vite file ops
   readViteConfig,
   writeViteConfig,
} from '../utils/file-ops';
import {
   getWebEslintPrettierDevDependency,
   getWebDevtoolsDevDependency,
   getWebTailwindcssDevDependency,
   getWebVueRouterDependency,
   getWebPiniaDependency,
   getWebAxiosDependency,
   getWebTailwindcssDependency,
   getWebNProgressDependency,
   getWebAntDesignVueDependency,
   getWebAutoComponentsDependency,
} from '../project-settings/web-vue.setting';

import { type ViteConfig } from '../types';
import { copyFileSync, copySync, writeFileSync } from 'fs-extra';

//处理web-vue配置设置
/**
 * 处理 web-vue 模板的工具配置
 * 主要就是更新package.json还有别的配置
 */
export async function WebVueToolsSettings(
   selectedTools: string[],
   targetDir: string,
   projectName: string,
): Promise<void> {
   const packageJson = await readPackageJson(targetDir);
   const tsConfigOps = new TsconfigOps(path.resolve(targetDir, 'tsconfig.app.json'));
   const gitIgnoreOps = await createGitOpsInstance(targetDir);
   const maintsOps = new MainFileOps(path.join(targetDir, 'src', 'main.ts'));

   await tsConfigOps.init();
   await maintsOps.init();

   if (!packageJson) throw new Error('package.json 文件不存在');

   let dependencies: Record<string, string> = packageJson.dependencies || {};
   let devDependencies: Record<string, string> = packageJson.devDependencies || {};
   let scripts: Record<string, string> = packageJson.scripts || {};
   let viteConfig: ViteConfig | null = await readViteConfig(path.join(targetDir, 'vite.config.ts'));

   viteConfig?.imports?.push("import path from 'path';");
   if (!viteConfig) {
      throw new Error('vite.config.ts 文件不存在');
   }
   // 配置路径别名名，以字符串形式保留语法

   if (!viteConfig.resolve) {
      viteConfig.resolve = {};
   }
   if (!viteConfig.resolve.alias) {
      viteConfig.resolve.alias = {};
   }
   appendRecordToRecord(
      {
         "\'@\'": "__RAW__path.resolve(__dirname, './src')",
      },
      viteConfig.resolve.alias,
   );
   tsConfigOps.addPaths('@/*', ['src/*']).setBaseUrl('.');

   for (const tool of selectedTools) {
      switch (tool) {
         case 'eslint-prettier':
            //配置 ESLint 和 Prettierfor Vue
            appendRecordToRecord(getWebEslintPrettierDevDependency(), devDependencies);
            const newScripts: Record<string, string> = {
               lint: 'eslint --ext .ts .',
               format: 'prettier --write .',
               'lint:fix': 'eslint "src/**/*.{js,ts}" --fix',
               'code:fix': 'pnpm run lint:fix && pnpm run format',
            };
            appendRecordToRecord(newScripts, scripts);
            //将resources/web/code-format复制到targetDir中
            const sourceCodeFormatDir = path.resolve(__dirname, '../resources/web/code-format');
            await copyDir(sourceCodeFormatDir, targetDir);
            break;
         case 'devtools':
            //配置devtools for Vue
            appendRecordToRecord(getWebDevtoolsDevDependency(), devDependencies);

            viteConfig.imports?.push('import vueDevTools from "vite-plugin-vue-devtools";');
            viteConfig.plugins?.push('vueDevTools()');

            break;
         case 'tailwindcss':
            // 配置 TailwindCSS for Vue
            appendRecordToRecord(getWebTailwindcssDevDependency(), devDependencies);
            appendRecordToRecord(getWebTailwindcssDependency(), dependencies);
            //在targetDir/src/assets创建一个tailwind.css文件，然后内容如下
            //@import "tailwindcss";
            //这里还要操作vite.config.ts

            await putInTailwindCssFileGenerate(
               path.join(targetDir, 'src', 'assets', 'tailwind.css'),
            );
            viteConfig.imports?.push('import tailwindcss from "@tailwindcss/vite";');
            viteConfig.plugins?.push('tailwindcss()');
            // 添加到 main.ts 配置中
            maintsOps.addImports(["import './assets/tailwind.css';"]);

            break;
         case 'axios':
            //将 axios 添加到 dependencies
            appendRecordToRecord(getWebAxiosDependency(), dependencies);
            //复制文件夹
            const axiosRawPath = path.resolve(__dirname, '../resources/web/request-client');
            await copyDirWithSelf(axiosRawPath, path.join(targetDir, 'src'));

            break;
         case 'pinia':
            // 配置 Pinia for Vue
            appendRecordToRecord(getWebPiniaDependency(), dependencies);
            //复制文件夹
            const piniaStoreRawPath = path.resolve(__dirname, '../resources/web/store');
            await copyDirWithRename(piniaStoreRawPath, path.join(targetDir, 'src'), 'store');
            // 添加 pinia 的 main.ts 配置
            maintsOps.addImports(['import { setupStore } from "@/store";']);
            maintsOps.addSetupCodes(['// 配置 Pinia 状态管理', 'setupStore(app);']);

            break;
         case 'vue-router':
            //配置 Vue Router
            appendRecordToRecord(getWebVueRouterDependency(), dependencies);
            appendRecordToRecord(getWebNProgressDependency(), dependencies);
            const routerStorgeRawPath = path.resolve(__dirname, '../resources/web/vue-router');
            copyDirWithRename(routerStorgeRawPath, path.join(targetDir, 'src'), 'router');

            // 添加 vue-router 的 main.ts 配置
            maintsOps.addImports([
               'import { router } from "@/router";',
               'import { setupRouterGuard } from "./router/guard";',
            ]);
            maintsOps.addSetupCodes([
               '// 配置路由',
               'app.use(router);',
               '// 配置路由守卫',
               'setupRouterGuard(router);',
            ]);
            //src/views/index.vue
            const appContent = await readTextFileContent(path.join(targetDir, 'src/App.vue'));
            // 修复路径引用，使用 @ 别名
            const fixedAppContent = appContent
               .replace(/from '\.\//g, "from '@/")
               .replace(/src="\.\/assets\//g, 'src="@/assets/')
               .replace(/src="\.\/components\//g, 'src="@/components/')
               .replace(/import.*from '\.\//g, match => match.replace(/from '\.\//, "from '@/"))
               .replace(/import.*from '\.\/components\//g, match =>
                  match.replace(/from '\.\/components\//, "from '@/components/"),
               )
               .replace(/import.*from '\.\/assets\//g, match =>
                  match.replace(/from '\.\/assets\//, "from '@/assets/"),
               );
            await writeTextFile(path.join(targetDir, 'src/views/index.vue'), fixedAppContent);
            //读取resources/web/newApp.vue内容，写入src/App.vue
            const newAppContent = await readTextFileContent(
               path.resolve(__dirname, '../resources/web/App.vue'),
            );
            await writeTextFile(path.join(targetDir, 'src/App.vue'), newAppContent);

            break;
         case 'vite-proxy':
            // 确保 server 对象存在
            if (!viteConfig.server) {
               viteConfig.server = {};
            }
            // 确保 proxy 对象存在
            if (!viteConfig.server.proxy) {
               viteConfig.server.proxy = {};
            }

            // 直接添加代理配置，使用 __RAW__ 前缀处理函数
            viteConfig.server.proxy["'/api'"] = {
               target: 'http://localhost:3000',
               changeOrigin: true,
               rewrite: "__RAW__(path: string) => path.replace(/^\\/api/, '')",
            };
            break;
         case 'env':
            //处理环境变量
            copyFileSync(
               path.resolve(__dirname, '../resources/web/vite-env.d.ts'),
               path.join(targetDir, 'src', 'vite-env.d.ts'),
            );
            const envFilePath = path.join(targetDir, '.env');
            writeFileSync(envFilePath, `VITE_API_BASE_URL=http://your-ip:your-port\n`);

            copySync(
               path.resolve(__dirname, '../resources/web/ENVREADME.md'),
               path.join(targetDir, 'ENVREADME.md'),
            );
            break;
         case 'ant-design-vue':
            //配置ant-design-vue组件库
            tsConfigOps.appendTypes(['ant-design-vue/typings/global.d.ts']);
            gitIgnoreOps.appendLines(['# auto compoents types', 'components.d.ts']);
            appendRecordToRecord(getWebAntDesignVueDependency(), dependencies);
            appendRecordToRecord(getWebAutoComponentsDependency(), devDependencies);

            viteConfig.imports?.push("import Components from 'unplugin-vue-components/vite';");
            viteConfig.imports?.push(
               "import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';",
            );
            viteConfig.plugins?.push(
               'Components({resolvers: [AntDesignVueResolver({ importStyle: false })]})',
            );
            break;
      }
   }

   // 统一应用 main.ts 配置
   await maintsOps.saveMainFile();
   // 写入vite.config.ts和package.json还有tsconfig.json
   if (viteConfig) {
      await writeViteConfig(path.join(targetDir, 'vite.config.ts'), viteConfig);
   }
   await writePackageJson(targetDir, {
      ...packageJson,
      dependencies,
      devDependencies,
      scripts,
   });
   // 写入tsconfig.json,和.gitignore
   await tsConfigOps.save();
   await gitIgnoreOps.save();
   // 将resources/web/.vscode复制到targetDir中
   const _vsCode = path.resolve(__dirname, '../resources/web/.vscode');
   await copyDirWithSelf(_vsCode, targetDir);
}
