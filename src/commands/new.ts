import path from 'path';

import { execa } from 'execa';
import { downloadTemplate, isGitHubUrl, parseGitHubUrl } from '../utils/download';
import { TEMPLATES, TEMPLATE_TOOLS } from '../templates-settings/index';
import { WebVueToolsSettings, ElectronToolsSettings, NodeToolsSettings } from '../handler';
import { TemplateConfig, PackageManager } from '../types';
import {
   //base file ops
   pathExists,
   emptyDir,
   ensureDir,
   toValidPackageName,
} from '../utils/file-ops';
import {
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
   promptInitGit,
} from '../utils/prompt';

export async function newProject(projectName?: string, isInit: boolean = false): Promise<void> {
   try {
      // 1. 获取项目名称
      const name = projectName || (await promptProjectName());
      const targetDir = path.resolve(process.cwd(), name);

      // 2. 选择模板
      const template = await promptTemplate(TEMPLATES);

      let isNeedGitInit = await promptInitGit();

      // 3. 选择工具配置
      const templateTools = TEMPLATE_TOOLS[template] || [];
      const selectedTools = await promptToolOptions(templateTools);
      console.log(`\n已选择工具: ${selectedTools.length > 0 ? selectedTools.join(', ') : '无'}`);

      // 4. 检查目录是否存在（在用户完成所有选择后）
      if (await pathExists(targetDir)) {
         if (!isInit) {
            const shouldOverwrite = await promptOverwrite(targetDir);
            if (!shouldOverwrite) {
               showError('操作已取消');
               return;
            }
         }
         await emptyDir(targetDir);
      } else {
         await ensureDir(targetDir);
      }

      // 5. 下载模板
      console.log('\n正在下载模板...');

      // 创建实时交互进度条
      const progressBar = createProgressBar('下载模板');
      progressBar.start(100, 0);

      try {
         const downloadOptions = {
            onProgress: (progress: { current: number; total: number; percentage: number }) => {
               // 实时更新进度条
               progressBar.update(progress.current, {
                  status: `${progress.percentage}% 完成`,
                  eta: progress.current < 100 ? '下载中...' : '完成',
               });
            },
         };

         if (isGitHubUrl(template)) {
            // 如果是 GitHub URL，解析并下载
            const parsed = parseGitHubUrl(template);
            if (parsed) {
               const templateConfig: TemplateConfig = {
                  name: 'custom',
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
         progressBar.update(100, { status: '下载完成!' });
         progressBar.stop();
         console.log(''); // 添加空行
         showSuccess('模板下载完成');
      } catch (error) {
         progressBar.stop();
         console.log(''); // 添加空行
         throw error;
      }

      // 6. 根据模板和选择的工具进行处理
      await processSelectedTools(template, selectedTools, targetDir, toValidPackageName(name));

      // 7. 安装依赖
      let shouldInstall = false;
      let packageManager: PackageManager = 'pnpm';
      shouldInstall = await promptInstallDeps();
      if (shouldInstall) {
         packageManager = await promptPackageManager();
         await installDependencies(targetDir, packageManager);
      }

      // 8. 初始化 Git 仓库
      if (isNeedGitInit) {
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
               stdio: 'inherit',
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
      } else if (typeof error === 'string') {
         showError(error);
      } else {
         showError('发生了未知错误');
      }
      process.exit(1);
   }
}

async function installDependencies(
   targetDir: string,
   packageManager: PackageManager,
): Promise<void> {
   const s = createSpinner();
   s.start(`正在使用 ${packageManager} 安装依赖...`);

   try {
      await execa(packageManager, ['install'], {
         cwd: targetDir,
         stdio: 'pipe',
      });
      s.stop('依赖安装完成');
   } catch (error) {
      s.stop('依赖安装失败');
      throw new Error(`依赖安装失败: ${error instanceof Error ? error.message : String(error)}`);
   }
}

async function initGitRepo(targetDir: string): Promise<void> {
   try {
      await execa('git', ['init'], { cwd: targetDir, stdio: 'pipe' });
   } catch (error) {
      // Git 初始化失败不是致命错误，静默处理
      // 可以在调试模式下显示错误信息
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
   projectName: string,
): Promise<void> {
   console.log(`\n正在为 ${template} 模板配置工具进行配置...`);

   // 根据不同模板进行不同的处理
   switch (template) {
      case 'web-vue':
         await WebVueToolsSettings(selectedTools, targetDir, projectName);
         break;
      case 'electron-vue':
         await ElectronToolsSettings(selectedTools, targetDir);
         break;
      case 'node':
         await NodeToolsSettings(selectedTools, targetDir);
         break;
      default:
         console.log(`未知模板: ${template}`);
   }
}
