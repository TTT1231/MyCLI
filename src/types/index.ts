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

export interface PackageJson {
   name: string;
   version: string;
   description?: string;
   scripts?: Record<string, string>;
   dependencies?: Record<string, string>;
   devDependencies?: Record<string, string>;
   [key: string]: any;
}

export interface ViteConfig {
   imports?: string[];
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
