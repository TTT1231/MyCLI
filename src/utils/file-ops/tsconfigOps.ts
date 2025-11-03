import fs from 'fs-extra';
import type { CompilerOptions, Tsconfig } from './types';

/**
 * TypeScript 配置文件操作工具类
 * @usage  @example
 * const tsconfigOps = new TsconfigOps(filePath); //包含文件名和拓展名
 * await tsconfigOps.init() //初始化,完成文件读取
 * //addPaths
 * tsConfigOps.addPaths('@/*', ['src/*']).setBaseUrl('.');
 * //appendTypes
 * tsConfigOps.appendTypes(['ant-design-vue/typings/global.d.ts']);
 * //end save
 * await tsConfigOps.save();
 */
export class TsconfigOps {
   private filePath: string;
   private config: Tsconfig | null;

   constructor(filePath: string) {
      this.filePath = filePath;
      this.config = null;
   }

   /**
    * 去除 JSON 文件中的注释
    * @param jsonString JSON 字符串
    * @returns 去除注释后的 JSON 字符串
    */
   private removeJsonComments(jsonString: string): string {
      let result = '';
      let inString = false;
      let inSingleComment = false;
      let inMultiComment = false;
      let stringChar = '';

      for (let i = 0; i < jsonString.length; i++) {
         const char = jsonString[i];
         const nextChar = jsonString[i + 1];

         // 处理字符串状态
         if (!inSingleComment && !inMultiComment) {
            if ((char === '"' || char === "'") && (i === 0 || jsonString[i - 1] !== '\\')) {
               if (!inString) {
                  inString = true;
                  stringChar = char;
               } else if (char === stringChar) {
                  inString = false;
                  stringChar = '';
               }
            }
         }

         // 如果在字符串中，直接添加字符
         if (inString) {
            result += char;
            continue;
         }

         // 处理注释
         if (!inSingleComment && !inMultiComment) {
            if (char === '/' && nextChar === '/') {
               inSingleComment = true;
               i++; // 跳过下一个字符
               continue;
            } else if (char === '/' && nextChar === '*') {
               inMultiComment = true;
               i++; // 跳过下一个字符
               continue;
            }
         }

         // 结束单行注释
         if (inSingleComment && char === '\n') {
            inSingleComment = false;
            result += char; // 保留换行符
            continue;
         }

         // 结束多行注释
         if (inMultiComment && char === '*' && nextChar === '/') {
            inMultiComment = false;
            i++; // 跳过下一个字符
            continue;
         }

         // 如果不在注释中，添加字符
         if (!inSingleComment && !inMultiComment) {
            result += char;
         }
      }

      // 去除行尾的逗号（在最后一个属性后）
      result = result.replace(/,(\s*[}\]])/g, '$1');

      return result;
   }

   /**
    * 读取并解析 tsconfig.json 文件
    * @returns Promise<void>
    */
   async init(): Promise<void> {
      try {
         if (!(await fs.pathExists(this.filePath))) {
            throw new Error(`文件不存在: ${this.filePath}`);
         }

         const content = await fs.readFile(this.filePath, 'utf-8');
         const cleanContent = this.removeJsonComments(content);
         this.config = JSON.parse(cleanContent) as Tsconfig;
      } catch (error) {
         throw new Error(
            `读取 tsconfig.json 失败: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   }

   /**
    * 保存配置到文件
    * @returns Promise<void>
    */
   async save(): Promise<void> {
      try {
         if (!this.config) {
            throw new Error('配置未加载，请先调用 init() 方法');
         }

         const content = JSON.stringify(this.config, null, 3);
         await fs.writeFile(this.filePath, content, 'utf-8');
      } catch (error) {
         throw new Error(
            `保存 tsconfig.json 失败: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   }

   /**
    * 向 compilerOptions.types 数组追加内容
    * @param types 要追加的类型数组
    * @returns TsconfigOps 实例，支持链式调用
    */
   appendTypes(types: string[]): TsconfigOps {
      if (!this.config) {
         throw new Error('配置未加载，请先调用 init() 方法');
      }

      // 确保 compilerOptions 存在
      if (!this.config.compilerOptions) {
         this.config.compilerOptions = {};
      }

      // 确保 types 数组存在
      if (!this.config.compilerOptions.types) {
         this.config.compilerOptions.types = [];
      }

      // 追加新的类型，避免重复
      for (const type of types) {
         if (!this.config.compilerOptions.types.includes(type)) {
            this.config.compilerOptions.types.push(type);
         }
      }

      return this;
   }

   /**
    * 向 compilerOptions 追加字段
    * @param options 要追加的编译选项对象
    * @returns TsconfigOps 实例，支持链式调用
    */
   appendCompilerOptions(options: Partial<CompilerOptions>): TsconfigOps {
      if (!this.config) {
         throw new Error('配置未加载，请先调用 init() 方法');
      }

      // 确保 compilerOptions 存在
      if (!this.config.compilerOptions) {
         this.config.compilerOptions = {};
      }

      // 追加新的选项，不覆盖现有的
      for (const [key, value] of Object.entries(options)) {
         if (!(key in this.config.compilerOptions)) {
            this.config.compilerOptions[key] = value;
         }
      }

      return this;
   }

   /**
    * 设置 baseUrl
    * @param baseUrl 基础路径
    * @returns TsconfigOps 实例，支持链式调用
    */
   setBaseUrl(baseUrl: string): TsconfigOps {
      return this.appendCompilerOptions({ baseUrl });
   }

   /**
    * 设置路径映射
    * @param paths 路径映射对象
    * @returns TsconfigOps 实例，支持链式调用
    */
   setPaths(paths: Record<string, string[]>): TsconfigOps {
      if (!this.config) {
         throw new Error('配置未加载，请先调用 init() 方法');
      }

      // 确保 compilerOptions 存在
      if (!this.config.compilerOptions) {
         this.config.compilerOptions = {};
      }

      // 如果 paths 不存在，创建新的；如果存在，合并路径
      if (!this.config.compilerOptions.paths) {
         this.config.compilerOptions.paths = {};
      }

      // 追加新的路径映射，不覆盖现有的
      for (const [key, value] of Object.entries(paths)) {
         if (!(key in this.config.compilerOptions.paths)) {
            this.config.compilerOptions.paths[key] = value;
         }
      }

      return this;
   }

   /**
    * 添加单个路径别名
    * @param alias 别名键，如 "@/*"
    * @param paths 路径数组，如 ["src/*"]
    * @returns TsconfigOps 实例，支持链式调用
    */
   addPaths(alias: string, paths: string[]): TsconfigOps {
      if (!this.config) {
         throw new Error('配置未加载，请先调用 init() 方法');
      }

      // 确保 compilerOptions 存在
      if (!this.config.compilerOptions) {
         this.config.compilerOptions = {};
      }

      // 如果 paths 不存在，创建新的
      if (!this.config.compilerOptions.paths) {
         this.config.compilerOptions.paths = {};
      }

      // 添加新的路径映射，不覆盖现有的
      if (!(alias in this.config.compilerOptions.paths)) {
         this.config.compilerOptions.paths[alias] = paths;
      }

      return this;
   }

   /**
    * 获取当前配置
    * @returns 当前配置对象
    */
   getConfig(): Tsconfig | null {
      return this.config;
   }

   /**
    * 检查文件是否存在
    * @returns Promise<boolean>
    */
   async exists(): Promise<boolean> {
      return await fs.pathExists(this.filePath);
   }
}

/**
 * 便捷函数：创建 TsconfigOps 实例
 * @param filePath tsconfig.json 文件路径
 * @returns TsconfigOps 实例
 */
export function createTsconfigOps(filePath: string): TsconfigOps {
   return new TsconfigOps(filePath);
}

/**
 * 便捷函数：快速操作 tsconfig.json 文件
 * @param filePath tsconfig.json 文件路径
 * @param operations 操作函数
 * @returns Promise<void>
 */
export async function operateTsconfig(
   filePath: string,
   operations: (ops: TsconfigOps) => TsconfigOps | Promise<TsconfigOps>,
): Promise<void> {
   const ops = new TsconfigOps(filePath);
   await ops.init();
   await operations(ops);
   await ops.save();
}
