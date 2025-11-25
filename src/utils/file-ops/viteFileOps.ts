import fs from 'fs-extra';
import { ViteConfig } from '../../types';
import { pathExists } from './baseFileOps';
import {
   extractComments,
   generateViteConfigContent,
   parseConfigObject,
   parseImports,
} from './utils';
interface ViteProxyOptions {
   prefixName: string;
   prefixTarget: string;
   changeOrigin?: boolean;
   rewrite?: (path: string) => string;
   headers?: Record<string, string>;
}

/**
 * ViteConfig 操作类
 * @example
 * const viteOps = new ViteConfigOps('/path/to/vite.config.ts');
 * await viteOps.init();
 * viteOps
 *   .addImport("import vue from '@vitejs/plugin-vue'")
 *   .addPlugin('vue()')
 *   .addAlias({ '@': "path.resolve(__dirname, './src')" })
 *   .addProxy({ prefixName: '/api', prefixTarget: 'http://localhost:3000', changeOrigin: true });
 * await viteOps.save();
 */
export class ViteConfigOps {
   private viteConfigPath: string;
   private viteConfigData: ViteConfig;

   constructor(viteConfigPath: string) {
      this.viteConfigPath = viteConfigPath;
      this.viteConfigData = {} as ViteConfig;
   }
   async init(): Promise<void> {
      if (!(await pathExists(this.viteConfigPath))) {
         throw new Error(`Vite配置文件不存在: ${this.viteConfigPath}`);
      }

      const content = await fs.readFile(this.viteConfigPath, 'utf-8');
      const imports = parseImports(content);
      const comments = extractComments(content);
      const configObject = parseConfigObject(content);
      this.viteConfigData = {
         imports,
         comments,
         ...this.viteConfigData,
         ...configObject,
      };
   }

   public addImport(importStatement: string): ViteConfigOps {
      if (this.viteConfigData.imports === undefined) {
         this.viteConfigData.imports = [];
      }
      this.viteConfigData.imports?.push(importStatement);
      return this;
   }
   public addPlugin(pluginStatement: string): ViteConfigOps {
      if (this.viteConfigData.plugins === undefined) {
         this.viteConfigData.plugins = [];
      }
      this.viteConfigData.plugins.push(pluginStatement);
      return this;
   }
   /**
    * 添加代理配置
    * @param proxy 代理配置选项
    */
   public addProxy(proxy: ViteProxyOptions): ViteConfigOps {
      if (this.viteConfigData.server === undefined) {
         this.viteConfigData.server = {};
      }
      if (this.viteConfigData.server.proxy === undefined) {
         this.viteConfigData.server.proxy = {};
      }

      const proxyKey = `'${proxy.prefixName}'`;
      const proxyConfig: any = {
         target: proxy.prefixTarget,
      };

      if (proxy.changeOrigin !== undefined) {
         proxyConfig.changeOrigin = proxy.changeOrigin;
      }

      if (proxy.rewrite) {
         // 提取函数体,重新构建为标准格式
         const rewriteFunctionStr = proxy.rewrite.toString();
         let functionBody = '';
         let originalParamName = 'path'; // 默认参数名

         if (rewriteFunctionStr.includes('=>')) {
            // 箭头函数: (path) => path.replace(...) 或 path => path.replace(...)
            // 先提取参数名
            const paramMatch = rewriteFunctionStr.match(/\(?([^)=]*?)\)?\s*=>/);
            if (paramMatch) {
               originalParamName = paramMatch[1].trim();
            }

            const arrowMatch = rewriteFunctionStr.match(/=>\s*(.*)/);
            if (arrowMatch) {
               functionBody = arrowMatch[1].trim();
            }
         } else {
            // 普通函数: function(path) { ... }
            // 先提取参数名
            const paramMatch = rewriteFunctionStr.match(/function\s*\(\s*([^)]*?)\s*\)/);
            if (paramMatch) {
               originalParamName = paramMatch[1].trim();
            }

            const bodyMatch = rewriteFunctionStr.match(/{\s*([\s\S]*?)\s*}/);
            if (bodyMatch) {
               functionBody = bodyMatch[1].trim();
               // 如果以 return 开头,移除 return 关键字
               if (functionBody.startsWith('return ')) {
                  functionBody = functionBody.substring(7).trim();
               }
               // 移除末尾的分号
               if (functionBody.endsWith(';')) {
                  functionBody = functionBody.substring(0, functionBody.length - 1);
               }
            }
         }

         // 将函数体中的原始参数名替换为标准的 'path'
         if (originalParamName !== 'path') {
            // 使用正则表达式替换,确保替换的是完整的单词
            const paramRegex = new RegExp(`\\b${originalParamName}\\b`, 'g');
            functionBody = functionBody.replace(paramRegex, 'path');
         }

         // 构建标准格式的函数表达式
         proxyConfig.rewrite = `__RAW__(path) => ${functionBody}`;
      }

      if (proxy.headers) {
         proxyConfig.headers = proxy.headers;
      }

      this.viteConfigData.server.proxy[proxyKey] = proxyConfig;
      return this;
   }
   /**
    * 添加路径别名,自动添加 __RAW__ 前缀以保留代码语法
    * @param aliasRecord 别名记录,例如 { '@': "path.resolve(__dirname, './src')" }
    * !注意: 因为alias值必须是代码表达式，而不是字符串字面量，因此必须要经过__RAW___处理
    */
   public addAlias(aliasRecord: Record<string, string>): ViteConfigOps {
      if (this.viteConfigData.resolve === undefined) {
         this.viteConfigData.resolve = {};
      }
      if (this.viteConfigData.resolve.alias === undefined) {
         this.viteConfigData.resolve.alias = {};
      }

      // 添加别名,自动处理 __RAW__ 前缀
      for (const [key, value] of Object.entries(aliasRecord)) {
         // 如果用户已经添加了 __RAW__ 前缀,直接使用;否则自动添加
         if (value.startsWith('__RAW__')) {
            this.viteConfigData.resolve.alias[`'${key}'`] = value;
         } else {
            // alias 配置必须是代码表达式,所以自动添加 __RAW__
            this.viteConfigData.resolve.alias[`'${key}'`] = `__RAW__${value}`;
         }
      }

      return this;
   }

   async saveNoComments(): Promise<void> {
      const configContent = generateViteConfigContent(this.viteConfigData);
      try {
         await fs.writeFile(this.viteConfigPath, configContent, 'utf-8');
      } catch (error) {
         throw new Error(`写入 Vite 配置文件失败: ${error}`);
      }
   }
   async save(): Promise<void> {
      // 生成配置文件内容(带注释)
      const configContent = generateViteConfigContent(this.viteConfigData, true);

      try {
         await fs.writeFile(this.viteConfigPath, configContent, 'utf-8');
      } catch (error) {
         throw new Error(`写入 Vite 配置文件失败: ${error}`);
      }
   }
}
