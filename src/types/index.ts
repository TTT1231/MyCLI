export interface TemplateConfig {
   name: string;
   repository: string;
   branch?: string;
   directory?: string;
   isLocal?: boolean;
}

export interface ProjectOptions {
   name: string;
   template: string;
   targetDir?: string;
   overwrite?: boolean;
}

export interface CreateOptions {
   // 保留空接口，以备将来扩展
}

export interface CliContext {
   cwd: string;
   version: string;
   templates: Record<string, TemplateConfig>;
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm';
export type VscodeAddType = 'web' | 'electron' | 'nest';

export interface PackageJson {
   // 必需字段
   name: string;
   version: string;

   // 基本信息
   private?: boolean;
   description?: string;
   keywords?: string[];
   license?: string;

   // 作者和贡献者
   author?:
      | string
      | {
           name?: string;
           email?: string;
           url?: string;
        };
   contributors?: Array<
      | string
      | {
           name?: string;
           email?: string;
           url?: string;
        }
   >;
   maintainers?: Array<
      | string
      | {
           name?: string;
           email?: string;
           url?: string;
        }
   >;

   // 链接
   homepage?: string;
   repository?:
      | string
      | {
           type?: string;
           url?: string;
           directory?: string;
        };
   bugs?:
      | string
      | {
           url?: string;
           email?: string;
        };
   funding?:
      | string
      | {
           type?: string;
           url?: string;
        }
      | Array<
           | string
           | {
                type?: string;
                url?: string;
             }
        >;

   // 入口点
   main?: string;
   module?: string;
   browser?: string | Record<string, string | boolean>;
   types?: string;
   typings?: string;
   exports?: Record<string, any> | string;
   imports?: Record<string, any>;

   // 文件和目录
   files?: string[];
   bin?: Record<string, string> | string;
   man?: string | string[];
   directories?: {
      bin?: string;
      man?: string;
      doc?: string;
      lib?: string;
      test?: string;
      example?: string;
   };

   // 脚本
   scripts?: Record<string, string>;

   // 依赖
   dependencies?: Record<string, string>;
   devDependencies?: Record<string, string>;
   peerDependencies?: Record<string, string>;
   peerDependenciesMeta?: Record<
      string,
      {
         optional?: boolean;
      }
   >;
   optionalDependencies?: Record<string, string>;
   bundledDependencies?: string[] | boolean;
   bundleDependencies?: string[] | boolean;

   // 环境和平台
   engines?: {
      node?: string;
      npm?: string;
      yarn?: string;
      pnpm?: string;
      [engine: string]: string | undefined;
   };
   os?: string[];
   cpu?: string[];

   // 发布配置
   publishConfig?: {
      registry?: string;
      tag?: string;
      access?: 'public' | 'restricted';
      directory?: string;
      [key: string]: any;
   };

   // 工作空间
   workspaces?:
      | string[]
      | {
           packages?: string[];
           nohoist?: string[];
        };

   // 模块类型
   type?: 'module' | 'commonjs';

   // 包管理器
   packageManager?: string;

   // 配置
   config?: Record<string, any>;

   // ESLint 配置
   eslintConfig?: Record<string, any>;

   // Prettier 配置
   prettier?: Record<string, any> | string;

   // Babel 配置
   babel?: Record<string, any>;

   // Jest 配置
   jest?: Record<string, any>;

   // TypeScript 配置引用
   tsconfig?: string;

   // Browserslist
   browserslist?: string[] | Record<string, string[]>;

   // 侧门加载（sideEffects）
   sideEffects?: boolean | string[];

   // 其他任意字段
   [key: string]: any;
}

export interface ViteConfig {
   imports?: string[];
   comments?: string[];
   root?: string;
   base?: string;
   mode?: string;
   define?: Record<string, any>;
   plugins?: any[];
   publicDir?: string | false;
   cacheDir?: string;
   resolve?: {
      alias?: Record<string, string>;
      dedupe?: string[];
      conditions?: string[];
      mainFields?: string[];
      extensions?: string[];
      preserveSymlinks?: boolean;
   };
   css?: {
      modules?: any;
      postcss?: any;
      preprocessorOptions?: Record<string, any>;
      devSourcemap?: boolean;
   };
   json?: {
      namedExports?: boolean;
      stringify?: boolean;
   };
   esbuild?: any;
   assetsInclude?: string | RegExp | (string | RegExp)[];
   logLevel?: 'info' | 'warn' | 'error' | 'silent';
   clearScreen?: boolean;
   envDir?: string;
   envPrefix?: string | string[];
   server?: {
      host?: string | boolean;
      port?: number;
      strictPort?: boolean;
      https?: any;
      open?: boolean | string;
      proxy?: Record<string, any>;
      cors?: any;
      headers?: Record<string, string>;
      hmr?: any;
      watch?: any;
      middlewareMode?: any;
      fs?: {
         strict?: boolean;
         allow?: string[];
         deny?: string[];
      };
      origin?: string;
   };
   build?: {
      target?: string | string[];
      polyfillModulePreload?: boolean;
      outDir?: string;
      assetsDir?: string;
      assetsInlineLimit?: number;
      cssCodeSplit?: boolean;
      cssTarget?: string | string[];
      sourcemap?: boolean | 'inline' | 'hidden';
      rollupOptions?: any;
      commonjsOptions?: any;
      dynamicImportVarsOptions?: any;
      lib?: any;
      manifest?: boolean | string;
      ssrManifest?: boolean | string;
      ssr?: boolean | string;
      minify?: boolean | 'terser' | 'esbuild';
      terserOptions?: any;
      write?: boolean;
      emptyOutDir?: boolean | null;
      copyPublicDir?: boolean;
      reportCompressedSize?: boolean;
      chunkSizeWarningLimit?: number;
      watch?: any;
   };
   preview?: {
      host?: string | boolean;
      port?: number;
      strictPort?: boolean;
      https?: any;
      open?: boolean | string;
      proxy?: Record<string, any>;
      cors?: any;
      headers?: Record<string, string>;
   };
   optimizeDeps?: {
      entries?: string | string[];
      exclude?: string[];
      include?: string[];
      esbuildOptions?: any;
      force?: boolean;
      holdUntilCrawlEnd?: boolean;
   };
   ssr?: {
      external?: string[];
      noExternal?: string | RegExp | (string | RegExp)[] | true;
      target?: 'node' | 'webworker';
      format?: 'esm' | 'cjs';
   };
   worker?: {
      format?: 'es' | 'iife';
      plugins?: any[];
      rollupOptions?: any;
   };
   [key: string]: any;
}
