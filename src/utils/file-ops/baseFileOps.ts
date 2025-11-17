import fs from 'fs-extra';
import path from 'path';

export async function ensureDir(dir: string): Promise<void> {
   await fs.ensureDir(dir);
}

/**
 * 复制包含自身的文件夹到目标路径
 * @param srcDir 源文件夹路径
 * @param destParentDir 目标父文件夹路径（源文件夹将被完整复制到该目录下）
 */
export async function copyDirWithSelf(srcDir: string, destParentDir: string): Promise<void> {
   // 确保源文件夹存在
   if (!(await pathExists(srcDir))) {
      throw new Error(`源文件夹不存在: ${srcDir}`);
   }

   // 获取源文件夹的名称
   const srcDirName = path.basename(srcDir);
   // 目标路径为 父目录 + 源文件夹名称
   const destDir = path.join(destParentDir, srcDirName);

   // 确保目标父目录存在
   await fs.ensureDir(destParentDir);

   // 复制文件夹（包含自身）
   await fs.copy(srcDir, destDir, {
      filter: src => {
         // 保持与现有复制逻辑一致的过滤规则
         return !src.includes('node_modules') && !src.includes('.git');
      },
   });
}

/**
 * 复制文件夹并指定新名称
 * @param srcDir 源文件夹路径
 * @param destParentDir 目标父文件夹路径
 * @param newDirName 新的文件夹名称
 */
export async function copyDirWithRename(
   srcDir: string,
   destParentDir: string,
   newDirName: string,
): Promise<void> {
   // 确保源文件夹存在
   if (!(await pathExists(srcDir))) {
      throw new Error(`源文件夹不存在: ${srcDir}`);
   }

   // 验证新文件夹名称合法性
   if (!newDirName || newDirName.includes(path.sep)) {
      throw new Error(`无效的文件夹名称: ${newDirName}`);
   }

   // 构建目标路径
   const destDir = path.join(destParentDir, newDirName);
   // 确保目标父目录存在
   await fs.ensureDir(destParentDir);

   // 复制并使用新名称
   await fs.copy(srcDir, destDir, {
      filter: src => {
         return !src.includes('node_modules') && !src.includes('.git');
      },
   });
}

export async function pathExists(filePath: string): Promise<boolean> {
   return fs.pathExists(filePath);
}

export async function emptyDir(dir: string): Promise<void> {
   if (await pathExists(dir)) {
      await fs.emptyDir(dir);
   }
}

export async function copyDir(src: string, dest: string): Promise<void> {
   await fs.copy(src, dest, {
      filter: src => {
         // 过滤掉 node_modules 和 .git 目录，但保留 .gitignore 等文件
         const basename = path.basename(src);
         return !src.includes('node_modules') && basename !== '.git';
      },
   });
}

// 新增：复制单个文件到指定路径
export async function copyFileToProject(srcPath: string, destPath: string): Promise<void> {
   if (!(await pathExists(srcPath))) {
      throw new Error(`源文件不存在：${srcPath}`);
   }

   // 检查源路径是否为文件
   if (!(await fs.lstat(srcPath)).isFile()) {
      throw new Error(`路径 ${srcPath} 不是文件`);
   }

   // 确保目标路径的父目录存在
   const destDir = path.dirname(destPath);
   await ensureDir(destDir);

   // 复制文件（如果目标文件已存在会覆盖）
   await fs.copy(srcPath, destPath, {
      overwrite: true, // 明确指定覆盖已有文件
      filter: src => {
         // 确保只复制单个文件（过滤掉目录，避免意外复制文件夹）
         return fs.lstatSync(src).isFile();
      },
   });
}

/**
 * 读取文本文件，直接返回字符串格式的内容（默认 utf8 编码）
 * @param filePath 文本文件路径，包含文件拓展名
 * @returns 文本文件的内容（字符串）
 */
export async function readTextFileContent(filePath: string): Promise<string> {
   // 先判断文件是否存在
   if (!(await fs.pathExists(filePath))) {
      throw new Error(`文本文件不存在：${filePath}`);
   }
   // 确保路径指向的是文件（不是目录）
   const fileStat = await fs.stat(filePath);
   if (!fileStat.isFile()) {
      throw new Error(`路径不是文本文件：${filePath}`);
   }
   // 固定用 utf8 编码读取文本内容，直接返回字符串
   return fs.readFile(filePath, 'utf8');
}

/**
 * 写入文本内容到指定文件（文件/目录不存在时自动创建）
 * @param filePath 目标文件路径（含文件名）,包含文件拓展名
 * @param content 要写入的文本内容（字符串）
 */
export async function writeTextFile(filePath: string, content: string): Promise<void> {
   // 1. 获取文件所在的目录路径
   const dirPath = path.dirname(filePath);

   // 2. 确保目录存在（不存在则自动创建）
   await fs.ensureDir(dirPath);

   // 3. 写入内容（文件不存在则自动创建，存在则覆盖）
   await fs.writeFile(filePath, content, 'utf8');
}

/**
 * 将源对象（source）的所有键值对，浅拷贝并合并到目标对象（target）中，最终修改目标对象本身（无返回值）。
 */

export function appendRecordToRecord(
   source: Record<string, string>,
   target: Record<string, string>,
): void {
   for (const [key, value] of Object.entries(source)) {
      target[key] = value;
   }
}

export function isValidPackageName(name: string): boolean {
   return /^[a-z0-9-_]+$/.test(name);
}

export function toValidPackageName(name: string): string {
   return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/^-+|-+$/g, '');
}
