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
 * mainFileInstance.addSetupCodes(['setUpCode1..','setUpCode1',...], true)
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
      await this.initParseMainFile(originalContent);
   }

   //初始化解析里面内容，会重写里面的createApp(App).mount('#app')
   //转换成:
   //const app = createApp(App);
   //app.mount('#app');
   private async initParseMainFile(originalContent: string): Promise<void> {
      const importRegex = /^\s*import\s+.*?\s*$/gm;
      this.mainFileContent.imports = originalContent.match(importRegex) || [];
      this.mainFileContent.setupCode.push('const app = createApp(App);');

      // 清理所有末尾的换行符
      this.cleanTrailingNewlines();
   }

   /**
    * 清理 imports 和 setupCode 数组中所有元素末尾的换行符
    * 主要就是解决换行的统一性
    */
   private cleanTrailingNewlines(): void {
      // 清理 imports 中的换行符
      this.mainFileContent.imports = this.mainFileContent.imports.map(item =>
         item.replace(/[\r\n]+$/, ''),
      );

      // 清理 setupCode 中的换行符
      this.mainFileContent.setupCode = this.mainFileContent.setupCode.map(item =>
         item.replace(/[\r\n]+$/, ''),
      );
   }

   //add setup code
   public addSetupCodes(setUpCodes: string[], frontline: boolean = true): MainFileOps {
      setUpCodes.forEach((value, index) => {
         // 清理末尾换行符后再添加
         const cleanedValue = value.replace(/[\r\n]+$/, '');

         // 如果是第一个元素且需要前置换行，则先添加空行
         if (index === 0 && frontline) {
            this.mainFileContent.setupCode.push('');
         }

         this.mainFileContent.setupCode.push(cleanedValue);
      });
      return this;
   }
   //add imports
   public addImports(imports: string[]): MainFileOps {
      // 清理末尾换行符后再添加
      imports.forEach(value => {
         const cleanedValue = value.replace(/[\r\n]+$/, '');
         this.mainFileContent.imports.push(cleanedValue);
      });
      return this;
   }
   public async saveMainFile(): Promise<void> {
      //为了美观，这里添加换行
      const newContent = [
         ...this.mainFileContent.imports,
         '', //分割imports 和 setupCode
         ...this.mainFileContent.setupCode,
         '', //分割setupCode 和 mount
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
