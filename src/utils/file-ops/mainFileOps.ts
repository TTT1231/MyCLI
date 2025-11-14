import { ensureFile, readFile, writeFile } from 'fs-extra';
import type { MainTsConfig } from './types';

/**
 * 操作main.ts文件工具类
 * @usage @example
 * const mainFileInstance = new MainFileOps('/path/to/main.ts');
 * mainFileInstance.init();
 *
 * //add imports
 * mainFileInstance.appImports(['import1..','import2',...])
 * //add setUpCodes
 * mainFileInstance.addSetupCodes(['setUpCode1..','setUpCode1',...])
 * //end save
 * mainFileInstance.save()
 */
export class MainFileOps {
   //文件路径，包含文件拓展
   private mainFilePath: string;
   //里面的内容，进行切片分开了
   private mainFileContent: MainTsConfig = {
      imports: [],
      setupCode: [],
   };

   constructor(mainFilePath: string) {
      this.mainFilePath = mainFilePath;
   }

   //init
   async init(): Promise<void> {
      await ensureFile(this.mainFilePath);
      let originalContent = await readFile(this.mainFilePath, 'utf-8');
      this.initParseMainFile(originalContent);
   }

   //初始化解析里面内容，会重写里面的createApp(App).mount('#app')
   //转换成:
   //const app = createApp(App);
   //app.mount('#app');
   private async initParseMainFile(originalContent: string): Promise<void> {
      const importRegex = /^\s*import\s+.*?\s*$/gm;
      this.mainFileContent.imports = originalContent.match(importRegex) || [];
      this.mainFileContent.setupCode.push('const app = createApp(App);');
   }

   //add setup code
   public addSetupCodes(setUpCodes: string[]): MainFileOps {
      setUpCodes.forEach((value, index) => {
         this.mainFileContent.setupCode.push(value);
         // 只在注释行后添加空行，且不是最后一行
         if (isCommentStart(value) && index < setUpCodes.length - 1) {
            this.mainFileContent.setupCode.push('');
         }
      });
      return this;
   }
   //add imports
   public addImports(imports: string[]): MainFileOps {
      imports.forEach(value => this.mainFileContent.imports.push(value));
      return this;
   }
   public async saveMainFile(): Promise<void> {
      //为了美观，这里添加换行
      const newContent = [
         ...this.mainFileContent.imports,
         '', //分割imports 和 setupCode
         ...this.mainFileContent.setupCode,
         "app.mount('#app')",
      ].join('\n');
      const contentWithNewLine = newContent.endsWith('\n') ? newContent : `${newContent}\n`;
      try {
         await writeFile(this.mainFilePath, contentWithNewLine, 'utf-8');
      } catch {
         throw new Error('main.ts文件保存失败');
      }
   }
}

/**
 * 判断字符串是否以注释开头（// 或 /*）
 * @param str 要检测的字符串
 * @returns 以注释开头则返回 true，否则返回 false
 */
function isCommentStart(str: string): boolean {
   // 匹配以 // 或 /* 开头的字符串（忽略开头可能的空白字符）
   const commentRegex = /^\s*(\/\/|\/\*)/;
   return commentRegex.test(str);
}
