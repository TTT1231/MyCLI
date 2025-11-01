import { ensureDir } from './baseFileOps';
import { writeFile } from 'fs-extra';
import path from 'path';

/**
 * @description 在指定路径生成tailwind.css文件，用来配置vite tailwindcss
 * @param {string} putInPath - 要放置的文件路径（包含文件名）
 * @returns {Promise<void>} - 异步操作的 Promise
 */
export async function putInTailwindCssFileGenerate(putInPath: string): Promise<void> {
   try {
      // 确保文件的父目录存在（如果不存在则自动创建）
      const parentDir = path.dirname(putInPath);
      await ensureDir(parentDir);

      // 写入文件内容
      const fileContent = '@import "tailwindcss";';
      await writeFile(putInPath, fileContent, 'utf8');
   } catch (error) {
      throw new Error(`创建 tailwind.css 文件失败: ${error instanceof Error ? error.message : String(error)}`);
   }
}
