import { intro, outro, text, select, confirm, spinner, isCancel } from '@clack/prompts';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { PackageManager } from '../types';
import { customMultiselect } from './customMultiselect';

export function showIntro(message: string): void {
   intro(chalk.bgBlue(chalk.white(' CLI Scaffolding Tool ')));
   console.log(chalk.gray(message));
}

export function showOutro(message: string): void {
   outro(chalk.green(message));
}

export async function promptProjectName(defaultName?: string): Promise<string> {
   const defaultProjectName = defaultName || 'my-project';
   const name = await text({
      message: '项目名称:',
      placeholder: defaultProjectName,
      validate: value => {
         // 如果用户没有输入，使用默认值，不需要验证
         if (!value) return undefined;
         if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
            return '项目名称只能包含字母、数字、连字符和下划线';
         }
         return undefined;
      },
   });

   // 检查用户是否取消了操作
   if (isCancel(name)) {
      showError('操作已取消');
      process.exit(0);
   }

   // 如果用户没有输入任何内容，返回默认项目名
   return (name as string) || defaultProjectName;
}

export async function promptTemplate(templates: Record<string, any>): Promise<string> {
   const templateOptions = Object.entries(templates).map(([key, template]) => ({
      value: key,
      label: template.name,
   }));

   const template = await select({
      message: '选择项目模板:',
      options: templateOptions,
   });

   // 检查用户是否取消了操作
   if (isCancel(template)) {
      showError('操作已取消');
      process.exit(0);
   }

   return template as string;
}

export async function promptOverwrite(targetDir: string): Promise<boolean> {
   const overwrite = await confirm({
      message: `目录 ${chalk.yellow(targetDir)} 已存在，是否覆盖？`,
      initialValue: false,
   });

   // 检查用户是否取消了操作
   if (isCancel(overwrite)) {
      showError('操作已取消');
      process.exit(0);
   }

   return overwrite as boolean;
}

export async function promptPackageManager(): Promise<PackageManager> {
   const packageManager = await select({
      message: '选择包管理器:',
      options: [
         { value: 'pnpm', label: 'pnpm' },
         { value: 'npm', label: 'npm' },
         { value: 'yarn', label: 'yarn' },
      ],
   });

   // 检查用户是否取消了操作
   if (isCancel(packageManager)) {
      showError('操作已取消');
      process.exit(0);
   }

   return packageManager as PackageManager;
}

export async function promptInstallDeps(): Promise<boolean> {
   const install = await confirm({
      message: '是否安装依赖?',
      initialValue: true,
   });

   // 检查用户是否取消了操作
   if (isCancel(install)) {
      showError('操作已取消');
      process.exit(0);
   }

   return install as boolean;
}

export async function promptToolOptions(
   options: Array<{ value: string; label: string }>,
): Promise<string[]> {
   const tools = await customMultiselect({
      message: '选择要配置的工具:',
      options: options,
      required: false,
      initialValues: [], // 默认全部未选择
   });

   // 检查用户是否取消了操作
   if (tools.length === 0 && options.length > 0) {
      // 如果没有选择任何工具但有可选项，可能是用户取消了操作
      // 这里我们允许用户不选择任何工具
   }

   // 归一化：确保返回值是 options 中的 value（避免意外返回 label 导致逻辑未命中）
   const valueByLabel = new Map(options.map(o => [o.label, o.value]));
   const valueSet = new Set(options.map(o => o.value));
   const normalized = tools
      .map(t => (valueSet.has(t) ? t : valueByLabel.get(t) || null))
      .filter((v): v is string => v !== null);

   return normalized;
}

export function createSpinner(message?: string) {
   return spinner();
}

export function createProgressBar(title: string = '下载进度'): cliProgress.SingleBar {
   return new cliProgress.SingleBar(
      {
         format: `${chalk.cyan(title)} |${chalk.green('{bar}')}| ${chalk.yellow('{percentage}%')} | ${chalk.gray('{value}/{total}')} | ${chalk.blue('{status}')}`,
         barCompleteChar: '\u2588',
         barIncompleteChar: '\u2591',
         hideCursor: true,
         clearOnComplete: false,
         stopOnComplete: true,
         forceRedraw: true,
      },
      cliProgress.Presets.shades_classic,
   );
}

export function showError(message: string): void {
   console.error(chalk.red(`✖ ${message}`));
}

export function showSuccess(message: string): void {
   console.log(chalk.green(`✓ ${message}`));
}

export function showWarning(message: string): void {
   console.log(chalk.yellow(`⚠ ${message}`));
}
