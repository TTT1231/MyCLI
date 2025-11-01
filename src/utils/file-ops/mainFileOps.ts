import { ensureFile, readFile, writeFile } from 'fs-extra';

/**
 * 多工具配置的 main.ts 配置收集器
 */
export interface MainTsConfig {
   imports: string[];
   setupCode: string[];
}

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
      // 解析原始 import 语句，但去除空行
      const lines = originalContent.split('\n');
      const imports: string[] = [];
      
      for (const line of lines) {
         const trimmedLine = line.trim();
         if (trimmedLine.startsWith('import ') && !trimmedLine.startsWith('//')) {
            imports.push(line.trim()); // 去除前后空白，统一格式
         }
      }
      
      this.mainFileContent.imports = imports;
      this.mainFileContent.setupCode.push('const app = createApp(App);');
   }

   //add setup code
   public addSetupCodes(setUpCodes: string[]): MainFileOps {
      // 直接添加，不添加额外空行
      setUpCodes.forEach(value => {
         this.mainFileContent.setupCode.push(value);
      });
      return this;
   }
   //add imports
   public addImports(imports: string[]): MainFileOps {
      imports.forEach(value => this.mainFileContent.imports.push(value.trim()));
      return this;
   }
   public async saveMainFile(): Promise<void> {
      // 构建最终内容，精确控制格式
      const contentParts: string[] = [];
      
      // 添加所有 import 语句（不添加空行）
      contentParts.push(...this.mainFileContent.imports);
      
      // import 和 setup 代码之间添加一个空行
      contentParts.push('');
      
      // 添加 setup 代码，在代码块之间添加空行（但不在注释后添加）
      for (let i = 0; i < this.mainFileContent.setupCode.length; i++) {
         const code = this.mainFileContent.setupCode[i];
         const isComment = isCommentStart(code);
         const nextCode = i < this.mainFileContent.setupCode.length - 1 ? this.mainFileContent.setupCode[i + 1] : null;
         const nextIsComment = nextCode ? isCommentStart(nextCode) : false;
         
         contentParts.push(code);
         
         // 只在非注释代码后且下一行是注释时添加空行（用于分隔不同的代码块）
         if (!isComment && nextIsComment && i < this.mainFileContent.setupCode.length - 1) {
            contentParts.push('');
         }
      }
      
      // 在 mount 语句前添加空行
      contentParts.push('');
      
      // 添加最后的 mount 语句
      contentParts.push("app.mount('#app')");
      
      const newContent = contentParts.join('\n');
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
