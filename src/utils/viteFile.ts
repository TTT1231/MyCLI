import fs from 'fs-extra';
import path from 'path';
import { ViteConfig } from '../types';

export async function pathExists(filePath: string): Promise<boolean> {
   return fs.pathExists(filePath);
}

export async function readViteConfig(dir: string): Promise<ViteConfig | null> {
   const viteConfigPath = path.join(dir, 'vite.config.ts');
   const viteConfigJsPath = path.join(dir, 'vite.config.js');

   let configPath: string | null = null;

   // 检查 vite.config.ts 或 vite.config.js 是否存在
   if (await pathExists(viteConfigPath)) {
      configPath = viteConfigPath;
   } else if (await pathExists(viteConfigJsPath)) {
      configPath = viteConfigJsPath;
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
      const defineConfigMatch = content.match(
         /defineConfig\s*\(\s*({[\s\S]*})\s*\)/
      );
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
            if (
               trimmed.startsWith('"') ||
               trimmed.startsWith("'") ||
               trimmed.startsWith('`')
            ) {
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

export async function writeViteConfig(
   dir: string,
   config: ViteConfig,
   useTypeScript: boolean = true
): Promise<void> {
   const configFileName = useTypeScript ? 'vite.config.ts' : 'vite.config.js';
   const configPath = path.join(dir, configFileName);

   // 生成配置文件内容
   const configContent = generateViteConfigContent(config, useTypeScript);

   try {
      await fs.writeFile(configPath, configContent, 'utf-8');
   } catch (error) {
      throw new Error(`写入 Vite 配置文件失败: ${error}`);
   }
}

function generateViteConfigContent(
   config: ViteConfig,
   useTypeScript: boolean
): string {
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
      if (parentKey === 'plugins' && (obj.includes('(') && obj.includes(')'))) {
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
      const entries = Object.entries(obj).filter(
         ([_, value]) => value !== undefined
      );
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

export async function updateViteConfig(
   dir: string,
   updates: Partial<ViteConfig>,
   useTypeScript: boolean = true
): Promise<void> {
   // 读取现有配置
   const existingConfig = (await readViteConfig(dir)) || {};

   // 合并配置
   const mergedConfig = mergeViteConfig(existingConfig, updates);

   // 写入更新后的配置
   await writeViteConfig(dir, mergedConfig, useTypeScript);
}

function mergeViteConfig(
   existing: ViteConfig,
   updates: Partial<ViteConfig>
): ViteConfig {
   const merged = { ...existing };

   Object.keys(updates).forEach(key => {
      const updateValue = updates[key as keyof ViteConfig];
      if (updateValue !== undefined) {
         if (key === 'imports') {
            // 特殊处理imports数组，合并而不是替换
            const existingImports = existing.imports || [];
            const newImports = updateValue as string[];
            merged.imports = [...existingImports, ...newImports];
         } else if (
            typeof updateValue === 'object' &&
            !Array.isArray(updateValue) &&
            updateValue !== null
         ) {
            // 深度合并对象
            merged[key as keyof ViteConfig] = {
               ...((existing[key as keyof ViteConfig] as any) || {}),
               ...updateValue,
            };
         } else {
            // 直接替换
            merged[key as keyof ViteConfig] = updateValue as any;
         }
      }
   });

   return merged;
}

export async function hasViteConfig(dir: string): Promise<boolean> {
   const viteConfigPath = path.join(dir, 'vite.config.ts');
   const viteConfigJsPath = path.join(dir, 'vite.config.js');

   return (
      (await pathExists(viteConfigPath)) || (await pathExists(viteConfigJsPath))
   );
}

export async function getViteConfigPath(dir: string): Promise<string | null> {
   const viteConfigPath = path.join(dir, 'vite.config.ts');
   const viteConfigJsPath = path.join(dir, 'vite.config.js');

   if (await pathExists(viteConfigPath)) {
      return viteConfigPath;
   } else if (await pathExists(viteConfigJsPath)) {
      return viteConfigJsPath;
   }

   return null;
}

/**
 * 在指定目录的 src/assets 下创建 tailwind.css 文件并写入内容
 * @param {string} targetDir - 目标根目录（如项目根目录）
 * @returns {Promise<void>} - 异步操作的 Promise
 */
export async function createTailwindCssFile(targetDir: string): Promise<void> {
   try {
      // 构建文件完整路径：targetDir/src/assets/tailwind.css
      const filePath = path.join(targetDir, 'src', 'assets', 'tailwind.css');

      // 确保父目录存在（如果不存在则自动创建）
      await fs.ensureDir(path.dirname(filePath));

      // 写入文件内容
      const fileContent = '@import "tailwindcss";';
      await fs.writeFile(filePath, fileContent, 'utf8');
   } catch {
      throw 'new tailwind css fail'; // 抛出错误供调用方处理
   }
}
