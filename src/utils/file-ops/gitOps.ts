import * as fs from 'fs-extra';
import * as path from 'path';
import { pathExists } from './baseFileOps';

class GitOps {
   private gitignorePath: string;
   private content: string = '';
   private loaded: boolean = false;

   constructor(projectDir: string) {
      this.gitignorePath = path.resolve(projectDir, '.gitignore');
   }

   /**
    * 检查 .gitignore 文件是否存在
    * @returns boolean
    */
   async exists(): Promise<boolean> {
      return await pathExists(this.gitignorePath);
   }

   /**
    * 加载 .gitignore 文件内容到内存
    * @returns Promise<void>
    */
   async load(): Promise<void> {
      try {
         if (await pathExists(this.gitignorePath)) {
            this.content = await fs.readFile(this.gitignorePath, 'utf-8');
         } else {
            this.content = '';
         }
         this.loaded = true;
      } catch (error) {
         throw new Error(
            `加载 .gitignore 文件失败: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   }

   /**
    * 读取 .gitignore 文件内容
    * @returns Promise<string>
    */
   async read(): Promise<string> {
      if (this.loaded) {
         return this.content;
      }

      try {
         if (!(await this.exists())) {
            return '';
         }
         return await fs.readFile(this.gitignorePath, 'utf-8');
      } catch (error) {
         throw new Error(
            `读取 .gitignore 文件失败: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   }

   /**
    * 写入 .gitignore 文件内容
    * @param content 文件内容
    * @returns Promise<void>
    */
   async write(content: string): Promise<void> {
      try {
         await fs.writeFile(this.gitignorePath, content, 'utf-8');
      } catch (error) {
         throw new Error(
            `写入 .gitignore 文件失败: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   }

   /**
    * 保存内存中的内容到文件
    * @returns Promise<void>
    */
   async save(): Promise<void> {
      if (!this.loaded) {
         throw new Error('内容未加载，请先调用 load() 方法');
      }

      try {
         await fs.writeFile(this.gitignorePath, this.content, 'utf-8');
      } catch (error) {
         throw new Error(
            `保存 .gitignore 文件失败: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   }

   /**
    * 在 .gitignore 文件末尾追加内容
    * @param content 要追加的内容
    * @param addNewLine 是否在追加前添加换行符，默认为 true
    * @returns GitOps 支持链式调用
    */
   append(content: string, addNewLine: boolean = true): GitOps {
      if (!this.loaded) {
         throw new Error('内容未加载，请先调用 load() 方法');
      }

      // 如果内容为空，直接设置内容
      if (!this.content) {
         this.content = content;
         if (!this.content.endsWith('\n')) {
            this.content += '\n';
         }
         return this;
      }

      // 检查是否需要添加换行符
      if (addNewLine && !this.content.endsWith('\n')) {
         this.content += '\n';
      }

      // 追加新内容
      this.content += content;

      // 确保文件以换行符结尾
      if (!this.content.endsWith('\n')) {
         this.content += '\n';
      }

      return this;
   }

   /**
    * 追加多行内容到 .gitignore
    * @param lines 要追加的行数组
    * @param addSeparator 是否添加分隔符注释，默认为 true
    * @param separatorComment 分隔符注释内容
    * @returns GitOps 支持链式调用
    */
   appendLines(
      lines: string[],
      addSeparator: boolean = true,
      separatorComment: string = '# Added by CLI',
   ): GitOps {
      if (!this.loaded) {
         throw new Error('内容未加载，请先调用 load() 方法');
      }

      let content = '';

      if (addSeparator) {
         content += `\n# ${separatorComment}\n`;
      }

      content += lines.join('\n');

      return this.append(content, true);
   }

   /**
    * 检查 .gitignore 中是否已包含指定内容
    * @param pattern 要检查的模式
    * @returns boolean
    */
   contains(pattern: string): boolean {
      if (!this.loaded) {
         throw new Error('内容未加载，请先调用 load() 方法');
      }
      return this.content.includes(pattern);
   }
}

/**
 * @description 创建.gitignore文件操作实例类
 * @param projectDir 项目目录
 * @returns GitOps 实例
 *
 * @example
 * //基础使用
 * const gitignoreOps = createGitOpsInstance('/path/to/project')
 * gitOps.append('*.log')
 *       .appendLines(['*.tmp', 'temp/'])
 *       .append('custom-file.txt');
 * await gitOps.save();
 */
export async function createGitOpsInstance(projectDir: string): Promise<GitOps> {
   const gitOps = new GitOps(projectDir);
   await gitOps.load();
   gitOps.append('\n');
   return gitOps;
}
