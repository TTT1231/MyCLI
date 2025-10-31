#!/usr/bin/env node

import { cac } from 'cac';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import { createProject } from './commands/create';
import { initProject } from './commands/init';
import pkg from '../package.json' 

// 检查更新
const notifier = updateNotifier({ pkg });
notifier.notify();

const cli = cac('my-cli');

// 全局选项
cli
  .option('--force', '强制覆盖目标目录')
  .option('--no-git', '跳过 git 初始化')
  .option('--no-install', '跳过依赖安装')
  .help()
  .version(pkg.version, '-v, -V, --version');

// create 命令
cli
  .command('create [project-name]', '创建新项目')
  .option('-t, --template <template>', '指定模板')
  .option('--force', '强制覆盖目标目录')
  .option('--no-git', '跳过 git 初始化')
  .option('--no-install', '跳过依赖安装')
  .action(async (projectName, options) => {
    await createProject(projectName, options);
  });

// init 命令
cli
  .command('init', '在当前目录初始化项目')
  .option('-t, --template <template>', '指定模板')
  .option('--no-git', '跳过 git 初始化')
  .option('--no-install', '跳过依赖安装')
  .action(async (options) => {
    await initProject(options);
  });

// 默认命令（当没有指定命令时）
cli
  .command('', '创建新项目（默认命令）')
  .action(async () => {
    await createProject();
  });

// 错误处理
process.on('unhandledRejection', (err) => {
  console.error(chalk.red('Unhandled rejection:'), err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error(chalk.red('Uncaught exception:'), err);
  process.exit(1);
});

// 解析命令行参数
cli.parse();

// 如果没有提供任何参数，显示帮助信息
if (process.argv.length === 2) {
  cli.outputHelp();
}