import type { ViteConfig } from '../../../types';

function generateViteConfigContent(config: ViteConfig, withComments: boolean = false): string {
   const imports: string[] = [];

   // 添加自定义导入语句
   if (config.imports && config.imports.length > 0) {
      imports.push(...config.imports);
   } else {
      // 如果没有自定义导入，添加默认的defineConfig导入
      imports.push("import { defineConfig } from 'vite'");
   }

   // 创建配置对象（排除imports和comments字段）
   const { imports: _, comments, ...configObject } = config;

   // 生成配置对象字符串
   const configObjectStr = generateConfigObject(configObject, 0);

   // 组装最终内容
   let content = `${imports.join('\n')}\n\n`;

   // 如果需要添加注释且注释存在
   if (withComments && comments && comments.length > 0) {
      content += `${comments.join('\n')}\n`;
   }

   content += `export default defineConfig(${configObjectStr})\n`;

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

/**
 * @description 提取配置文件中的注释
 * @param content 文件内容
 * @returns 注释数组
 */
function extractComments(content: string): string[] {
   const comments: string[] = [];
   const lines = content.split('\n');
   let inImportSection = false;
   let importSectionEnded = false;

   for (const line of lines) {
      const trimmedLine = line.trim();

      // 检测是否在 import 区域
      if (trimmedLine.startsWith('import ')) {
         inImportSection = true;
         continue;
      }

      // import 区域结束后,开始收集注释
      if (inImportSection && trimmedLine && !trimmedLine.startsWith('import ')) {
         importSectionEnded = true;
      }

      // 收集 import 之后、export default 之前的注释
      if (importSectionEnded && !trimmedLine.startsWith('export default')) {
         if (
            trimmedLine.startsWith('//') ||
            trimmedLine.startsWith('/*') ||
            trimmedLine.startsWith('*') ||
            trimmedLine === ''
         ) {
            comments.push(line);
         }
      }

      // 遇到 export default 就停止收集
      if (trimmedLine.startsWith('export default')) {
         break;
      }
   }

   return comments;
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

export {
   generateViteConfigContent,
   generateConfigObject,
   parseImports,
   extractComments,
   parseConfigObject,
   parseStringProperty,
   parseArrayProperty,
   parseBooleanProperty,
   parseNestedObject,
   parsePluginsArray,
   parseDefineObject,
};
