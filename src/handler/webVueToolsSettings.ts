import path from 'path';

import {
   //base file ops
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
   PackageJsonOps,
   //tailwindcss file ops
   putInTailwindCssFileGenerate,
   //tsconfig file ops
   TsconfigOps,
   //vite file ops
   ViteConfigOps,
   updateHtmlTitle,
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
   //读取并初始化package.json,tsconfig.json,.gitignore,main.ts,vite.config.ts
   const packageJsonOps = new PackageJsonOps(path.resolve(targetDir, 'package.json'));
   const tsConfigOps = new TsconfigOps(path.resolve(targetDir, 'tsconfig.app.json'));
   const maintsOps = new MainFileOps(path.join(targetDir, 'src', 'main.ts'));
   const viteConfigOps = new ViteConfigOps(path.join(targetDir, 'vite.config.ts'));

   const gitIgnoreOps = await createGitOpsInstance(targetDir);
   await tsConfigOps.init();
   await maintsOps.init();
   await packageJsonOps.init();
   await viteConfigOps.init();

   // index.html 的 title
   await updateHtmlTitle(path.join(targetDir, 'index.html'), projectName);
   packageJsonOps.setField({ name: projectName });

   // 配置路径别名
   viteConfigOps
      .addImport("import path from 'path';")
      .addAlias({ '@': "path.resolve(__dirname, './src')" });

   tsConfigOps.addPaths('@/*', ['src/*']).setBaseUrl('.');

   for (const tool of selectedTools) {
      switch (tool) {
         case 'eslint-prettier':
            //配置 ESLint 和 Prettierfor Vue
            packageJsonOps.addDevDependency(getWebEslintPrettierDevDependency());
            const newScripts: Record<string, string> = {
               lint: 'eslint --ext .ts .',
               format: 'prettier --write .',
               'lint:fix': 'eslint "src/**/*.{js,ts}" --fix',
               'code:fix': 'pnpm run lint:fix && pnpm run format',
            };
            packageJsonOps.addScript(newScripts);
            //将resources/web/code-format复制到targetDir中
            const sourceCodeFormatDir = path.resolve(__dirname, '../resources/web/code-format');
            await copyDir(sourceCodeFormatDir, targetDir);
            break;
         case 'devtools':
            //配置devtools for Vue
            packageJsonOps.addDevDependency(getWebDevtoolsDevDependency());
            viteConfigOps
               .addImport('import vueDevTools from "vite-plugin-vue-devtools";')
               .addPlugin('vueDevTools()');
            break;
         case 'tailwindcss':
            // 配置 TailwindCSS for Vue
            packageJsonOps.addDevDependency(getWebTailwindcssDevDependency());
            packageJsonOps.addDependency(getWebTailwindcssDependency());
            //在targetDir/src/assets创建一个tailwind.css文件，然后内容如下
            //@import "tailwindcss";
            //这里还要操作vite.config.ts

            await putInTailwindCssFileGenerate(
               path.join(targetDir, 'src', 'assets', 'tailwind.css'),
            );
            viteConfigOps
               .addImport('import tailwindcss from "@tailwindcss/vite";')
               .addPlugin('tailwindcss()');
            // 添加到 main.ts 配置中
            maintsOps.addImports(["import './assets/tailwind.css';"]);
            break;
         case 'axios':
            //将 axios 添加到 dependencies
            packageJsonOps.addDependency(getWebAxiosDependency());
            //复制文件夹
            const axiosRawPath = path.resolve(__dirname, '../resources/web/request-client');
            await copyDirWithSelf(axiosRawPath, path.join(targetDir, 'src'));

            break;
         case 'pinia':
            // 配置 Pinia for Vue
            packageJsonOps.addDependency(getWebPiniaDependency());
            //复制文件夹
            const piniaStoreRawPath = path.resolve(__dirname, '../resources/web/store');
            await copyDirWithRename(piniaStoreRawPath, path.join(targetDir, 'src'), 'store');
            // 添加 pinia 的 main.ts 配置
            maintsOps.addImports(['import { setupStore } from "@/store";']);
            maintsOps.addSetupCodes(['// 配置 Pinia 状态管理', 'setupStore(app);']);

            break;
         case 'vue-router':
            //配置 Vue Router
            packageJsonOps.addDependency(getWebVueRouterDependency());
            packageJsonOps.addDependency(getWebNProgressDependency());

            const routerStorgeRawPath = path.resolve(__dirname, '../resources/web/vue-router');
            copyDirWithRename(routerStorgeRawPath, path.join(targetDir, 'src'), 'router');

            // 添加 vue-router 的 main.ts 配置
            maintsOps.addImports([
               'import { router } from "@/router";',
               'import { setupRouterGuard } from "./router/guard";',
            ]);
            maintsOps.addSetupCodes(['// 配置路由', 'app.use(router);']);
            maintsOps.addSetupCodes(['// 配置路由守卫', 'setupRouterGuard(router);']);
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
            viteConfigOps.addProxy({
               perfixName: '/api',
               profixTarget: 'http://localhost:3000',
               changeOrigin: true,
               rewrite: path => path.replace(/^\/api/, ''),
            });
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
            packageJsonOps.addDependency(getWebAntDesignVueDependency());
            packageJsonOps.addDevDependency(getWebAutoComponentsDependency());
            viteConfigOps
               .addImport("import Components from 'unplugin-vue-components/vite';")
               .addImport(
                  "import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';",
               )
               .addPlugin(
                  'Components({resolvers: [AntDesignVueResolver({ importStyle: false })]})',
               );
            break;
      }
   }

   //========================================== 保存文件 ======================================
   await maintsOps.saveMainFile();
   await viteConfigOps.save();
   await packageJsonOps.save();
   await tsConfigOps.save();
   await gitIgnoreOps.save();

   //========================================= 其他文件 ======================================
   // 将resources/web/.vscode复制到targetDir中
   const _vsCode = path.resolve(__dirname, '../resources/web/.vscode');
   await copyDirWithSelf(_vsCode, targetDir);
}
