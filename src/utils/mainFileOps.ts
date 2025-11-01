import { readFile, ensureFile, writeFile } from 'fs-extra';
import path from 'path';
import { pathExists } from './file-ops/baseFileOps';
/**
 * 在指定目录的 src 下操作 main.ts 文件：
 * 1. 在头部增加指定内容
 * 2. 确保文件末尾有换行符
 * @param {string} targetDir - 目标根目录（如项目根目录）
 * @param {string} contentToPrepend - 要添加到头部的import内容
 * @returns {Promise<void>} - 异步操作的 Promise
 */
export async function appendToMainImport(
   targetDir: string,
   contentToPrepend: string,
): Promise<void> {
   try {
      // 构建 main.ts 的完整路径（默认放在 src 目录下，可根据实际调整）
      const mainTsPath = path.join(targetDir, 'src', 'main.ts');

      // 检查文件是否存在，不存在则创建空文件
      await ensureFile(mainTsPath);

      // 读取原文件内容
      let originalContent = await readFile(mainTsPath, 'utf8');

      // 1. 在头部添加内容（注意：如果需要换行，可在 contentToPrepend 末尾加 \n）
      const newContent = `${contentToPrepend}\n${originalContent}`;

      // 2. 确保末尾有换行符（如果原内容末尾没有，则添加）
      const contentWithNewLine = newContent.endsWith('\n') ? newContent : `${newContent}\n`;

      // 写入处理后的内容
      await writeFile(mainTsPath, contentWithNewLine, 'utf8');
   } catch {
      throw new Error('mian.ts中append错误');
   }
}

/**
 * 重写指定目录的 src/main.ts 文件：
 * 1. 读取原始的 import 语句
 * 2. 将原始 imports 与新的 imports 合并（原始在前，新的在后）
 * 3. 重写文件：finalImports + 换行 + other 内容
 * @param {string} targetDir - 目标根目录（如项目根目录）
 * @param {string[]} otherImports - 要添加的新 import 语句数组
 * @param {string[]} other - 其他要添加的代码内容数组
 * @returns {Promise<void>} - 异步操作的 Promise
 */
export async function rewriteMainFile(
   targetDir: string,
   otherImports: string[],
   other: string[],
): Promise<void> {
   try {
      // 构建 main.ts 的完整路径
      const mainTsPath = path.join(targetDir, 'src', 'main.ts');

      // 检查文件是否存在
      const fileExists = await pathExists(mainTsPath);
      let rawImports: string[] = [];

      if (fileExists) {
         // 读取原文件内容
         const originalContent = await readFile(mainTsPath, 'utf8');

         // 解析原始的 import 语句
         rawImports = parseImports(originalContent);
      }

      // 合并 imports：原始在前，新的在后
      const finalImports = [...rawImports, ...otherImports];

      // 构建新的文件内容
      const newContent = [
         ...finalImports,
         '', // 空行分隔 imports 和其他内容
         ...other,
      ].join('\n');

      // 确保末尾有换行符
      const contentWithNewLine = newContent.endsWith('\n') ? newContent : `${newContent}\n`;

      // 写入新内容
      await writeFile(mainTsPath, contentWithNewLine, 'utf8');
   } catch (error) {
      throw new Error(`重写 main.ts 文件错误: ${error}`);
   }
}

/**
 * 多工具配置的 main.ts 配置收集器
 */
export interface MainTsConfig {
   imports: string[];
   setupCode: string[];
}

/**
 * 收集并合并多个工具的 main.ts 配置，最后统一重写文件
 * @param {string} targetDir - 目标根目录
 * @param {MainTsConfig} config - 累积的配置对象
 * @returns {Promise<void>} - 异步操作的 Promise
 */
export async function applyMainTsConfig(targetDir: string, config: MainTsConfig): Promise<void> {
   try {
      // 构建 main.ts 的完整路径
      const mainTsPath = path.join(targetDir, 'src', 'main.ts');

      // 检查文件是否存在
      const fileExists = await pathExists(mainTsPath);
      let rawImports: string[] = [];

      if (fileExists) {
         // 读取原文件内容
         const originalContent = await readFile(mainTsPath, 'utf8');

         // 解析原始的 import 语句
         rawImports = parseImports(originalContent);
      }

      // 合并 imports：原始在前，新的在后，去重
      const allImports = [...rawImports, ...config.imports];
      const uniqueImports = Array.from(new Set(allImports));

      // 构建新的文件内容
      const newContent = [
         ...uniqueImports,
         '', // 空行分隔 imports 和其他内容
         ...config.setupCode,
      ].join('\n');

      // 确保末尾有换行符
      const contentWithNewLine = newContent.endsWith('\n') ? newContent : `${newContent}\n`;

      // 写入新内容
      await writeFile(mainTsPath, contentWithNewLine, 'utf8');
   } catch (error) {
      throw new Error(`应用 main.ts 配置错误: ${error}`);
   }
}

/**
 * 解析文件内容中的 import 语句
 * @param {string} content - 文件内容
 * @returns {string[]} - import 语句数组
 */
function parseImports(content: string): string[] {
   const imports: string[] = [];
   const lines = content.split('\n');

   for (const line of lines) {
      const trimmedLine = line.trim();
      // 匹配 import 语句（排除注释）
      if (trimmedLine.startsWith('import ') && !trimmedLine.startsWith('//')) {
         imports.push(line); // 保留原始缩进
      }
   }

   return imports;
}
