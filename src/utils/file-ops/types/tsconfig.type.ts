/**
 * TypeScript 配置文件结构定义
 */
export interface CompilerOptions {
   types?: string[];
   baseUrl?: string;
   paths?: Record<string, string[]>;
   [key: string]: any; // 允许其他编译选项
}

export interface Tsconfig {
   compilerOptions?: CompilerOptions;
   [key: string]: any; // 允许其他顶级配置
}
