import path from 'path';
import { newProject } from './new';
import { showIntro, showError } from '../utils/prompt';

export async function initProject(): Promise<void> {
   try {
      showIntro('在当前目录初始化项目');

      // 使用当前目录名作为项目名
      const currentDir = process.cwd();
      const projectName = path.basename(currentDir);

      // 调用 create 命令，但使用当前目录
      await newProject(projectName, true);
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
