import path from 'path';
import { ensureDir, pathExists } from '../utils/file-ops';
import { copy } from 'fs-extra';
import chalk from 'chalk';
import { showError, promptOverwrite } from '../utils/prompt';
import { type AddConfigType, ADD_CONFIGS } from '../project-settings/types';

export async function addProjectSettings(subcommand?: string): Promise<void> {
   try {
      // 如果没有提供子命令，显示帮助信息
      if (!subcommand) {
         showAddHelp();
         return;
      }

      // 验证提供的子命令是否有效
      if (!(subcommand in ADD_CONFIGS)) {
         showError(`未知的配置类型: ${subcommand}`);
         showAddHelp();
         process.exit(1);
      }

      const configType = subcommand as AddConfigType;

      // 根据配置类型执行相应的操作
      switch (configType) {
         case 'vscode':
            await addVscodeSettings();
            break;
         default:
            throw new Error(`❌ 未实现的配置类型: ${configType}`);
      }
   } catch (error) {
      handleError(error);
   }
}
// ================================ helpers =================================
// show add help
function showAddHelp(): void {
   console.log(chalk.bold('\n用法:'));
   console.log(`  ${chalk.cyan('trw add')} ${chalk.yellow('<config-type>')}\n`);
   console.log(chalk.bold('可用的配置类型:\n'));
   Object.entries(ADD_CONFIGS).forEach(([key, config]) => {
      console.log(`  ${chalk.green(key.padEnd(12))} ${chalk.gray(config.description)}`);
   });
   console.log('');
}
// error handler
function handleError(error: unknown): never {
   const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : '发生了未知错误';
   showError(message);
   process.exit(1);
}

// ============================== 实际处理流程  =================================
//add vscode
async function addVscodeSettings(): Promise<void> {
   const rootDir = process.cwd();
   // 使用相对于package.json的路径
   const vscodeSettingsPathSrc = path.join(rootDir, 'resources', '.vscode');
   const vscodeSettingsPathDest = path.join(rootDir, '.vscode');

   // 检查源配置是否存在
   if (!(await pathExists(vscodeSettingsPathSrc))) {
      throw new Error(`配置源路径不存在: ${vscodeSettingsPathSrc}`);
   }

   // 检查目标目录是否存在
   if (await pathExists(vscodeSettingsPathDest)) {
      const shouldOverwrite = await promptOverwrite(vscodeSettingsPathDest);
      if (!shouldOverwrite) {
         console.log(chalk.yellow('操作已取消'));
         process.exit(0);
      }
   }

   await ensureDir(vscodeSettingsPathDest); // 确保目标目录存在
   await copy(vscodeSettingsPathSrc, vscodeSettingsPathDest, {
      overwrite: true,
   }).catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`配置 VSCode 失败: ${message}`);
   });
   console.log(chalk.green('✨ 配置添加完成！'));
}
