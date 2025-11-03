import fs from 'fs-extra';
import { ViteConfig } from '../../types';
import { pathExists } from './baseFileOps';

/**
 * @description 读取vite文件内容工具
 * @param dir 读取文件路径包含文件名和文件拓展
 * @param viteName
 * @returns vite文件内容
 */
export async function readViteConfig(dir: string): Promise<ViteConfig | null> {
   let configPath: string | null = null;

   // 检查 vite.config.ts 或 vite.config.js 是否存在
   if (await pathExists(dir)) {
      configPath = dir;
   }

   if (!configPath) {
      return null;
   }

   try {
      // 读取配置文件内容
      const configContent = await fs.readFile(configPath, 'utf-8');

      // 解析import语句
      const imports = parseImports(configContent);

      // 解析配置对象
      const configObject = parseConfigObject(configContent);

      return {
         imports,
         ...configObject,
      };
   } catch (error) {
      console.error(`读取 Vite 配置文件失败: ${error}`);
      return null;
   }
}

/**
 * @description 用于写入vite配置文件内容
 * @param writeSrcDir 要写入目标路径，包含文件名还有文件拓展（文件不存在时会自动创建）
 * @param viteConfig  vite配置文件内容，例如vite.config.ts内容
 */
export async function writeViteConfig(writeSrcDir: string, viteConfig: ViteConfig): Promise<void> {
   // 生成配置文件内容
   const configContent = generateViteConfigContent(viteConfig);

   try {
      await fs.writeFile(writeSrcDir, configContent, 'utf-8');
   } catch (error) {
      throw new Error(`写入 Vite 配置文件失败: ${error}`);
   }
}

function generateViteConfigContent(config: ViteConfig): string {
   const imports: string[] = [];

   // 添加自定义导入语句
   if (config.imports && config.imports.length > 0) {
      imports.push(...config.imports);
   } else {
      // 如果没有自定义导入，添加默认的defineConfig导入
      imports.push("import { defineConfig } from 'vite'");
   }

   // 创建配置对象（排除imports字段）
   const { imports: _, ...configObject } = config;

   // 生成配置对象字符串
   const configObjectStr = generateConfigObject(configObject, 0);

   const content = `${imports.join('\n')}

export default defineConfig(${configObjectStr})
`;

   return content;
}

function generateConfigObject(obj: any, indent: number = 0, parentKey?: string): string {
   if (obj === null || obj === undefined) {
      return 'undefined';
   }

   if (typeof obj === 'string') {
      // 如果是plugins数组中的项，且看起来像函数调用，则不加引号
      if (parentKey === 'plugins' && obj.includes('(') && obj.includes(')')) {
         return obj;
      }
      // 如果字符串以 __RAW__ 开头，则作为原始代码输出（不加引号）
      if (obj.startsWith('__RAW__')) {
         return obj.substring(7); // 移除 __RAW__ 前缀
      }
      return `'${obj}'`;
   }

   if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
   }

   if (Array.isArray(obj)) {
      if (obj.length === 0) {
         return '[]';
      }
      const items = obj.map(item => generateConfigObject(item, indent + 2, parentKey));
      return `[\n${' '.repeat(indent + 2)}${items.join(`,\n${' '.repeat(indent + 2)}`)}\n${' '.repeat(indent)}]`;
   }

   if (typeof obj === 'object') {
      const entries = Object.entries(obj).filter(([_, value]) => value !== undefined);
      if (entries.length === 0) {
         return '{}';
      }

      const lines = entries.map(([key, value]) => {
         const formattedValue = generateConfigObject(value, indent + 2, key);
         return `${' '.repeat(indent + 2)}${key}: ${formattedValue}`;
      });

      return `{\n${lines.join(',\n')}\n${' '.repeat(indent)}}`;
   }

   return String(obj);
}

function parseImports(content: string): string[] {
   const imports: string[] = [];
   const lines = content.split('\n');

   for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('import ') && !trimmedLine.includes('//')) {
         imports.push(trimmedLine);
      }
   }

   return imports;
}

function parseConfigObject(content: string): Omit<ViteConfig, 'imports'> {
   const config: Omit<ViteConfig, 'imports'> = {};

   try {
      // 查找 defineConfig 调用
      const defineConfigMatch = content.match(/defineConfig\s*\(\s*({[\s\S]*})\s*\)/);
      if (!defineConfigMatch) {
         return config;
      }

      const configObjectStr = defineConfigMatch[1];

      // 解析常见的配置项
      parseStringProperty(configObjectStr, 'root', config);
      parseStringProperty(configObjectStr, 'base', config);
      parseStringProperty(configObjectStr, 'mode', config);
      parseStringProperty(configObjectStr, 'publicDir', config);
      parseStringProperty(configObjectStr, 'cacheDir', config);
      parseStringProperty(configObjectStr, 'envDir', config);

      // 解析数组属性
      parseArrayProperty(configObjectStr, 'envPrefix', config);

      // 解析布尔属性
      parseBooleanProperty(configObjectStr, 'clearScreen', config);

      // 解析嵌套对象
      parseNestedObject(configObjectStr, 'server', config);
      parseNestedObject(configObjectStr, 'build', config);
      parseNestedObject(configObjectStr, 'preview', config);
      parseNestedObject(configObjectStr, 'resolve', config);
      parseNestedObject(configObjectStr, 'css', config);
      parseNestedObject(configObjectStr, 'optimizeDeps', config);
      parseNestedObject(configObjectStr, 'ssr', config);
      parseNestedObject(configObjectStr, 'worker', config);

      // 解析plugins数组
      parsePluginsArray(configObjectStr, config);

      // 解析define对象
      parseDefineObject(configObjectStr, config);
   } catch (error) {
      console.error('解析配置对象失败:', error);
   }

   return config;
}

function parseStringProperty(content: string, key: string, config: any): void {
   const regex = new RegExp(`${key}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
   const match = content.match(regex);
   if (match) {
      config[key] = match[1];
   }
}

function parseArrayProperty(content: string, key: string, config: any): void {
   const regex = new RegExp(`${key}\\s*:\\s*\\[([^\\]]+)\\]`);
   const match = content.match(regex);
   if (match) {
      const arrayContent = match[1];
      const items = arrayContent
         .split(',')
         .map(item => {
            const trimmed = item.trim();
            if (trimmed.startsWith('"') || trimmed.startsWith("'") || trimmed.startsWith('`')) {
               return trimmed.slice(1, -1);
            }
            return trimmed;
         })
         .filter(item => item);
      config[key] = items;
   }
}

function parseBooleanProperty(content: string, key: string, config: any): void {
   const regex = new RegExp(`${key}\\s*:\\s*(true|false)`);
   const match = content.match(regex);
   if (match) {
      config[key] = match[1] === 'true';
   }
}

function parseNestedObject(content: string, key: string, config: any): void {
   const regex = new RegExp(`${key}\\s*:\\s*{([^}]+)}`);
   const match = content.match(regex);
   if (match) {
      const objectContent = match[1];
      const nestedConfig: any = {};

      // 解析嵌套对象的属性
      parseStringProperty(objectContent, 'host', nestedConfig);
      parseStringProperty(objectContent, 'outDir', nestedConfig);
      parseStringProperty(objectContent, 'assetsDir', nestedConfig);
      parseStringProperty(objectContent, 'target', nestedConfig);
      parseStringProperty(objectContent, 'format', nestedConfig);

      // 解析数字属性
      const portMatch = objectContent.match(/port\s*:\s*(\d+)/);
      if (portMatch) {
         nestedConfig.port = parseInt(portMatch[1]);
      }

      // 解析布尔属性
      parseBooleanProperty(objectContent, 'open', nestedConfig);
      parseBooleanProperty(objectContent, 'strictPort', nestedConfig);
      parseBooleanProperty(objectContent, 'emptyOutDir', nestedConfig);
      parseBooleanProperty(objectContent, 'sourcemap', nestedConfig);

      if (Object.keys(nestedConfig).length > 0) {
         config[key] = nestedConfig;
      }
   }
}

function parsePluginsArray(content: string, config: any): void {
   const pluginsMatch = content.match(/plugins\s*:\s*\[([^\]]+)\]/);
   if (pluginsMatch) {
      const pluginsContent = pluginsMatch[1];
      // 解析插件数组中的函数调用
      const plugins: string[] = [];

      // 分割插件，处理可能的嵌套和逗号
      const pluginItems = pluginsContent.split(',').map(item => item.trim());

      for (const item of pluginItems) {
         if (item && !item.startsWith('//')) {
            // 保留函数调用格式，不加引号
            plugins.push(item);
         }
      }

      config.plugins = plugins;
   }
}

function parseDefineObject(content: string, config: any): void {
   const defineMatch = content.match(/define\s*:\s*{([^}]+)}/);
   if (defineMatch) {
      const defineContent = defineMatch[1];
      const defineObj: any = {};

      // 解析define对象中的键值对
      const pairs = defineContent.split(',');
      for (const pair of pairs) {
         const [key, value] = pair.split(':').map(s => s.trim());
         if (key && value) {
            const cleanKey = key.replace(/['"]/g, '');
            const cleanValue = value.replace(/['"]/g, '');
            defineObj[cleanKey] = cleanValue;
         }
      }

      if (Object.keys(defineObj).length > 0) {
         config.define = defineObj;
      }
   }
}
