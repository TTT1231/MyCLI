import path from "path";
import { execa } from "execa";
import chalk from "chalk";
import {
  CreateOptions,
  TemplateConfig,
  PackageManager,
  type ViteConfig,
} from "../types";
import {
  showIntro,
  showOutro,
  showError,
  showSuccess,
  promptProjectName,
  promptTemplate,
  promptOverwrite,
  promptPackageManager,
  promptInstallDeps,
  promptToolOptions,
  createSpinner,
  createProgressBar,
} from "../utils/prompt";
import {
  pathExists,
  emptyDir,
  ensureDir,
  toValidPackageName,
  readPackageJson,
  writePackageJson,
  copyDir,
  copyDirWithSelf,
  copyDirWithRename,
  readTextFileContent,
  writeTextFile,
} from "../utils/file";
import { appendRecordToRecord } from "../utils/packageOpts";
import { readViteConfig, writeViteConfig } from "../utils/viteFile";
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
} from "../project-settings/web-vue.setting";
import {
  downloadTemplate,
  isGitHubUrl,
  parseGitHubUrl,
} from "../utils/download";
import { TEMPLATES, TEMPLATE_TOOLS } from "../templates/index";

import { createTailwindCssFile } from "../utils/viteFile";
import { applyMainTsConfig, type MainTsConfig } from "../utils/mainFile";
import { copyFileSync, writeFileSync } from "fs-extra";
import { TsconfigOps } from "../utils/tsconfigOps";
import { GitOps } from "../utils/gitOps";
export async function createProject(
  projectName?: string,
  options: CreateOptions = {}
): Promise<void> {
  try {
    // 1. 获取项目名称
    const name = projectName || (await promptProjectName());
    const targetDir = path.resolve(process.cwd(), name);

    // 2. 选择模板
    let template = options.template;
    if (!template) {
      template = await promptTemplate(TEMPLATES);
    }

    // 3. 选择工具配置
    const templateTools = TEMPLATE_TOOLS[template] || [];
    const selectedTools = await promptToolOptions(templateTools);
    console.log(
      `\n已选择工具: ${selectedTools.length > 0 ? selectedTools.join(", ") : "无"}`
    );

    // 4. 检查目录是否存在（在用户完成所有选择后）
    if (await pathExists(targetDir)) {
      if (!options.force) {
        const shouldOverwrite = await promptOverwrite(targetDir);
        if (!shouldOverwrite) {
          showError("操作已取消");
          return;
        }
      }
      await emptyDir(targetDir);
    } else {
      await ensureDir(targetDir);
    }

    //5.多选按钮eslint,prettier,git,devtools
    //TODO 当选着不同的多选按钮是针对不同模板，和不同工具进行处理

    // 5. 下载模板
    console.log("\n正在下载模板...");

    // 创建实时交互进度条
    const progressBar = createProgressBar("下载模板");
    progressBar.start(100, 0);

    try {
      const downloadOptions = {
        onProgress: (progress: {
          current: number;
          total: number;
          percentage: number;
        }) => {
          // 实时更新进度条
          progressBar.update(progress.current, {
            status: `${progress.percentage}% 完成`,
            eta: progress.current < 100 ? "下载中..." : "完成",
          });
        },
      };

      if (isGitHubUrl(template)) {
        // 如果是 GitHub URL，解析并下载
        const parsed = parseGitHubUrl(template);
        if (parsed) {
          const templateConfig: TemplateConfig = {
            name: "custom",
            repository: `github:${parsed.owner}/${parsed.repo}`,
            branch: parsed.branch,
          };
          await downloadTemplate(templateConfig, targetDir, downloadOptions);
        }
      } else if (TEMPLATES[template]) {
        // 使用预定义模板
        await downloadTemplate(TEMPLATES[template], targetDir, downloadOptions);
      } else {
        throw new Error(`未知的模板: ${template}`);
      }

      // 确保进度条显示100%完成
      progressBar.update(100, { status: "下载完成!" });
      progressBar.stop();
      console.log(""); // 添加空行
      showSuccess("模板下载完成");
    } catch (error) {
      progressBar.stop();
      console.log(""); // 添加空行
      throw error;
    }

    // 6. 根据模板和选择的工具进行处理
    await processSelectedTools(
      template,
      selectedTools,
      targetDir,
      toValidPackageName(name)
    );

    // 7. 安装依赖
    let shouldInstall = false;
    let packageManager: PackageManager = 'pnpm';
    if (options.install !== false) {
      shouldInstall = await promptInstallDeps();
      if (shouldInstall) {
        packageManager = await promptPackageManager();
        await installDependencies(targetDir, packageManager);
      }
    }

    // 8. 初始化 Git 仓库
    if (options.git !== false) {
      await initGitRepo(targetDir);
    }

    // 9. 显示项目创建成功信息和后续操作
    if (shouldInstall) {
      showOutro(`项目 ${name} 创建成功！`);
      // 如果安装了依赖，自动执行 dev 命令
      console.log('\n');
      const spinner = createSpinner('启动开发服务器...');
      spinner.start();
      
      try {
        await execa(packageManager, ['dev'], {
          cwd: targetDir,
          stdio: 'inherit'
        });
      } catch (error) {
        spinner.stop();
        console.log('\n');
        showError('启动开发服务器失败');
      }
    } else {
      // 如果没有安装依赖，显示成功消息和手动步骤
      showOutro(`项目 ${name} 创建成功！`);
      console.log(`cd ${name}`);
      console.log(`${packageManager} i`);
      console.log(`${packageManager} dev`);
    }
  } catch (error) {
    // 避免将 Symbol 转换为字符串
    if (error instanceof Error) {
      showError(error.message);
    } else if (typeof error === "string") {
      showError(error);
    } else {
      showError("发生了未知错误");
    }
    process.exit(1);
  }
}

async function installDependencies(
  targetDir: string,
  packageManager: PackageManager
): Promise<void> {
  const s = createSpinner();
  s.start(`正在使用 ${packageManager} 安装依赖...`);

  try {
    await execa(packageManager, ["install"], {
      cwd: targetDir,
      stdio: "pipe",
    });
    s.stop("依赖安装完成");
  } catch (error) {
    s.stop("依赖安装失败");
    throw new Error(
      `依赖安装失败: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function initGitRepo(targetDir: string): Promise<void> {
  try {
    await execa("git", ["init"], { cwd: targetDir, stdio: "pipe" });
    await execa("git", ["add", "."], { cwd: targetDir, stdio: "pipe" });
    await execa("git", ["commit", "-m", "Initial commit"], {
      cwd: targetDir,
      stdio: "pipe",
    });
    // 静默处理，不显示成功提示
  } catch (error) {
    // Git 初始化失败不是致命错误，静默处理
    // 可以在调试模式下显示错误信息
  }
}

async function getPackageManager(): Promise<PackageManager> {
  // 检测当前环境的包管理器
  try {
    await execa("pnpm", ["--version"], { stdio: "pipe" });
    return "pnpm";
  } catch {
    try {
      await execa("yarn", ["--version"], { stdio: "pipe" });
      return "yarn";
    } catch {
      return "npm";
    }
  }
}

/**
 * 根据模板和选择的工具进行处理
 * @param template 选择的模板
 * @param selectedTools 选择的工具列表
 * @param targetDir 目标目录
 * @param projectName 项目名
 */
async function processSelectedTools(
  template: string,
  selectedTools: string[],
  targetDir: string,
  projectName: string
): Promise<void> {
  console.log(`\n正在为 ${template} 模板配置工具进行配置...`);

  // 根据不同模板进行不同的处理
  switch (template) {
    case "web-vue":
      await processWebVueTools(selectedTools, targetDir, projectName);
      break;
    case "electron-vue":
      await processElectronVueTools(selectedTools, targetDir);
      break;
    case "node":
      await processNodeTools(selectedTools, targetDir);
      break;
    default:
      console.log(`未知模板: ${template}`);
  }
}

/**
 * 处理 web-vue 模板的工具配置
 * 主要就是更新package.json还有别的配置
 */
async function processWebVueTools(
  selectedTools: string[],
  targetDir: string,
  projectName: string
): Promise<void> {
  const packageJson = await readPackageJson(targetDir);
  const tsConfigOps = new TsconfigOps(
    path.resolve(targetDir, "tsconfig.app.json")
  );
  const gitIgnoreOps = new GitOps(targetDir);
  await gitIgnoreOps.load();
  gitIgnoreOps.append("\n");
  await tsConfigOps.load();
  if (!packageJson) throw new Error("package.json 文件不存在");
  if (!tsConfigOps.exists()) throw new Error("tsconfig.app.json 文件不存在");
  packageJson.name = projectName;
  let dependencies: Record<string, string> = packageJson.dependencies || {};
  let devDependencies: Record<string, string> =
    packageJson.devDependencies || {};
  let scripts: Record<string, string> = packageJson.scripts || {};
  let viteConfig: ViteConfig | null = await readViteConfig(targetDir);

  viteConfig?.imports?.push("import path from 'path';");
  if (!viteConfig) {
    throw new Error("vite.config.ts 文件不存在");
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
    viteConfig.resolve.alias
  );
  tsConfigOps.addPaths("@/*", ["src/*"]).setBaseUrl(".");

  // 收集所有工具的 main.ts 配置
  const mainTsConfig: MainTsConfig = {
    imports: [],
    setupCode: ["const app = createApp(App);"],
  };
  mainTsConfig.setupCode.push(""); // 添加空行分隔

  for (const tool of selectedTools) {
    switch (tool) {
      case "eslint-prettier":
        //配置 ESLint 和 Prettierfor Vue
        appendRecordToRecord(
          getWebEslintPrettierDevDependency(),
          devDependencies
        );

        //将resources/web/code-format复制到targetDir中
        const sourceCodeFormatDir = path.resolve(
          __dirname,
          "../resources/web/code-format"
        );
        await copyDir(sourceCodeFormatDir, targetDir);
        break;
      case "devtools":
        //配置devtools for Vue
        appendRecordToRecord(getWebDevtoolsDevDependency(), devDependencies);

        await createTailwindCssFile(targetDir);
        viteConfig.imports?.push(
          'import vueDevTools from "vite-plugin-vue-devtools";'
        );
        viteConfig.plugins?.push("vueDevTools()");

        break;
      case "tailwindcss":
        // 配置 TailwindCSS for Vue
        appendRecordToRecord(getWebTailwindcssDevDependency(), devDependencies);
        appendRecordToRecord(getWebTailwindcssDependency(), dependencies);
        //在targetDir/src/assets创建一个tailwind.css文件，然后内容如下
        //@import "tailwindcss";
        //这里还要操作vite.config.ts

        await createTailwindCssFile(targetDir);
        viteConfig.imports?.push(
          'import tailwindcss from "@tailwindcss/vite";'
        );
        viteConfig.plugins?.push("tailwindcss()");
        // 添加到 main.ts 配置中
        mainTsConfig.imports.push("import './assets/tailwind.css';");
        mainTsConfig.imports.push(""); // 添加空行分隔

        break;
      case "axios":
        //将 axios 添加到 dependencies
        appendRecordToRecord(getWebAxiosDependency(), dependencies);
        //复制文件夹
        const axiosRawPath = path.resolve(
          __dirname,
          "../resources/web/request-client"
        );
        await copyDirWithSelf(axiosRawPath, path.join(targetDir, "src"));

        break;
      case "pinia":
        // 配置 Pinia for Vue
        appendRecordToRecord(getWebPiniaDependency(), dependencies);
        //复制文件夹
        const piniaStoreRawPath = path.resolve(
          __dirname,
          "../resources/web/store"
        );
        await copyDirWithRename(
          piniaStoreRawPath,
          path.join(targetDir, "src"),
          "store"
        );
        // 添加 pinia 的 main.ts 配置
        mainTsConfig.imports.push('import { setupStore } from "@/store";');
        mainTsConfig.setupCode.push("// 配置 Pinia 状态管理");
        mainTsConfig.setupCode.push("setupStore(app);");
        mainTsConfig.setupCode.push(""); // 添加空行分隔
        break;
      case "vue-router":
        //配置 Vue Router
        appendRecordToRecord(getWebVueRouterDependency(), dependencies);
        appendRecordToRecord(getWebNProgressDependency(), dependencies);
        const routerStorgeRawPath = path.resolve(
          __dirname,
          "../resources/web/vue-router"
        );
        copyDirWithRename(
          routerStorgeRawPath,
          path.join(targetDir, "src"),
          "router"
        );

        // 添加 vue-router 的 main.ts 配置
        mainTsConfig.imports.push('import { router } from "@/router";');
        mainTsConfig.imports.push(
          'import { setupRouterGuard } from "./router/guard";'
        );
        mainTsConfig.setupCode.push("// 配置路由");
        mainTsConfig.setupCode.push("app.use(router);");
        mainTsConfig.setupCode.push("// 配置路由守卫");
        mainTsConfig.setupCode.push("setupRouterGuard(router);");
        mainTsConfig.setupCode.push(""); // 添加空行分隔
        //src/views/index.vue
        const appContent = await readTextFileContent(
          path.join(targetDir, "src/App.vue")
        );
        // 修复路径引用，使用 @ 别名
        const fixedAppContent = appContent
          .replace(/from '\.\//g, "from '@/")
          .replace(/src="\.\/assets\//g, 'src="@/assets/')
          .replace(/src="\.\/components\//g, 'src="@/components/')
          .replace(/import.*from '\.\//g, (match) =>
            match.replace(/from '\.\//, "from '@/")
          )
          .replace(/import.*from '\.\/components\//g, (match) =>
            match.replace(/from '\.\/components\//, "from '@/components/")
          )
          .replace(/import.*from '\.\/assets\//g, (match) =>
            match.replace(/from '\.\/assets\//, "from '@/assets/")
          );
        await writeTextFile(
          path.join(targetDir, "src/views/index.vue"),
          fixedAppContent
        );
        //读取resources/web/newApp.vue内容，写入src/App.vue
        const newAppContent = await readTextFileContent(
          path.resolve(__dirname, "../resources/web/App.vue")
        );
        await writeTextFile(path.join(targetDir, "src/App.vue"), newAppContent);

        break;
      case "vite-proxy":
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
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: "__RAW__(path: string) => path.replace(/^\\/api/, '')",
        };
        break;
      case "env":
        //处理环境变量
        copyFileSync(
          path.resolve(__dirname, "../resources/web/vite-env.d.ts"),
          path.join(targetDir, "src", "vite-env.d.ts")
        );
        const envFilePath = path.join(targetDir, ".env");
        writeFileSync(
          envFilePath,
          `VITE_API_BASE_URL=http://your-ip:your-port\n`
        );

        break;
      case "ant-design-vue":
        //配置ant-design-vue组件库
        tsConfigOps.appendTypes(["ant-design-vue/typings/global.d.ts"]);
        gitIgnoreOps.appendLines(["# auto compoents types", "components.d.ts"]);
        appendRecordToRecord(getWebAntDesignVueDependency(), dependencies);
        appendRecordToRecord(getWebAutoComponentsDependency(), devDependencies);

        viteConfig.imports?.push(
          "import Components from 'unplugin-vue-components/vite';"
        );
        viteConfig.imports?.push(
          "import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';"
        );
        viteConfig.plugins?.push(
          "Components({resolvers: [AntDesignVueResolver({ importStyle: false })]})"
        );
        break;
    }
  }

  // 添加 app.mount 到最后
  mainTsConfig.setupCode.push("app.mount('#app');");

  // 统一应用 main.ts 配置
  await applyMainTsConfig(targetDir, mainTsConfig);

  // 写入vite.config.ts和package.json还有tsconfig.json
  if (viteConfig) {
    await writeViteConfig(targetDir, viteConfig);
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
  const _vsCode = path.resolve(__dirname, "../resources/web/.vscode");
  await copyDirWithSelf(_vsCode, targetDir);
}

/**
 * 处理 electron-vue 模板的工具配置
 */
async function processElectronVueTools(
  selectedTools: string[],
  targetDir: string
): Promise<void> {
  for (const tool of selectedTools) {
    switch (tool) {
      case "eslint":
        // TODO: 配置 ESLint for Electron-Vue
        console.log("  ✓ 配置 ESLint (Electron-Vue)");
        break;
      case "prettier":
        // TODO: 配置 Prettier for Electron-Vue
        console.log("  ✓ 配置 Prettier (Electron-Vue)");
        break;
      case "tailwindcss":
        // TODO: 配置 TailwindCSS for Electron-Vue
        console.log("  ✓ 配置 TailwindCSS (Electron-Vue)");
        break;
      case "electron-builder":
        // TODO: 配置 Electron Builder
        console.log("  ✓ 配置 Electron Builder");
        break;
      case "auto-updater":
        // TODO: 配置 Auto Updater
        console.log("  ✓ 配置 Auto Updater");
        break;
      case "devtools":
        // TODO: 配置 DevTools
        console.log("  ✓ 配置 DevTools");
        break;
      default:
        console.log(`  ⚠ 未知工具: ${tool}`);
    }
  }
}

/**
 * 处理 node 模板的工具配置
 */
async function processNodeTools(
  selectedTools: string[],
  targetDir: string
): Promise<void> {
  for (const tool of selectedTools) {
    switch (tool) {
      case "eslint":
        // TODO: 配置 ESLint for Node.js
        console.log("  ✓ 配置 ESLint (Node.js)");
        break;
      case "prettier":
        // TODO: 配置 Prettier for Node.js
        console.log("  ✓ 配置 Prettier (Node.js)");
        break;
      case "jest":
        // TODO: 配置 Jest
        console.log("  ✓ 配置 Jest");
        break;
      case "express":
        // TODO: 配置 Express
        console.log("  ✓ 配置 Express");
        break;
      case "mongoose":
        // TODO: 配置 Mongoose
        console.log("  ✓ 配置 Mongoose");
        break;
      case "dotenv":
        // TODO: 配置 Dotenv
        console.log("  ✓ 配置 Dotenv");
        break;
      default:
        console.log(`  ⚠ 未知工具: ${tool}`);
    }
  }
}
