import type { PackageJson } from '../../types';
import { appendRecordToRecord, pathExists } from './baseFileOps';
import fs from 'fs-extra';

/**
 * PackageJson 操作类
 * @example
 * const pkgOps = new PackageJsonOps('/path/to/package.json');
 * await pkgOps.init();
 * pkgOps
 *   .setField({ name: 'my-package' })
 *   .addDependency({ 'vue': '^3.0.0' })
 *   .addDevDependency({ 'typescript': '^5.0.0' })
 *   .addScript({ 'dev': 'vite' });
 * await pkgOps.save();
 */
export class PackageJsonOps {
   private packageJsonPath: string;
   private packageJsonData: PackageJson;

   constructor(packageJsonPath: string) {
      this.packageJsonPath = packageJsonPath;
      this.packageJsonData = {} as PackageJson;
   }

   /**
    * 初始化，读取 package.json 文件
    */
   async init(): Promise<void> {
      if (!(await pathExists(this.packageJsonPath))) {
         throw new Error(`package.json 文件不存在: ${this.packageJsonPath}`);
      }
      this.packageJsonData = await fs.readJson(this.packageJsonPath);
   }

   /**
    * 对依赖对象进行字母排序
    * @param deps - 依赖对象
    * @returns 排序后的依赖对象
    */
   private sortDependencies(deps: Record<string, string>): Record<string, string> {
      return Object.keys(deps)
         .sort()
         .reduce(
            (acc, key) => {
               acc[key] = deps[key];
               return acc;
            },
            {} as Record<string, string>,
         );
   }

   /**
    * 按照标准顺序排列 package.json 的字段
    * @param pkg - package.json 对象
    * @param fieldOrder - 字段排序规则,默认为标准顺序
    * @returns 排序后的 package.json 对象
    */
   private sortPackageJson(
      pkg: PackageJson,
      fieldOrder: string[] = [
         'name',
         'private',
         'version',
         'type',
         'description',
         'keywords',
         'license',
         'author',
         'contributors',
         'homepage',
         'repository',
         'bugs',
         'main',
         'module',
         'types',
         'typings',
         'exports',
         'files',
         'bin',
         'man',
         'directories',
         'scripts',
         'dependencies',
         'devDependencies',
         'peerDependencies',
         'peerDependenciesMeta',
         'optionalDependencies',
         'bundledDependencies',
         'engines',
         'os',
         'cpu',
         'publishConfig',
         'workspaces',
         'packageManager',
      ],
   ): PackageJson {
      const sorted: PackageJson = {} as PackageJson;

      // 首先按照指定顺序添加字段
      for (const field of fieldOrder) {
         if (pkg[field] !== undefined) {
            // 对依赖类字段进行内部排序
            if (
               (field === 'dependencies' ||
                  field === 'devDependencies' ||
                  field === 'peerDependencies' ||
                  field === 'optionalDependencies') &&
               typeof pkg[field] === 'object'
            ) {
               sorted[field] = this.sortDependencies(pkg[field] as Record<string, string>);
            } else {
               sorted[field] = pkg[field];
            }
         }
      }

      // 然后添加其他未在排序规则中的字段
      for (const [key, value] of Object.entries(pkg)) {
         if (!fieldOrder.includes(key)) {
            sorted[key] = value;
         }
      }

      return sorted;
   }

   /**
    * 设置单个或多个字段
    * @param field 要设置的字段对象
    */
   public setField(field: Partial<PackageJson>): PackageJsonOps {
      this.packageJsonData = { ...this.packageJsonData, ...field };
      return this;
   }

   /**
    * 向 dependencies 添加依赖，重复的会直接覆盖
    * @param dependency 依赖对象
    */
   public addDependency(dependency: Record<string, string>): PackageJsonOps {
      if (!this.packageJsonData.dependencies) {
         this.packageJsonData.dependencies = {};
      }
      appendRecordToRecord(dependency, this.packageJsonData.dependencies);
      return this;
   }

   /**
    * 向 devDependencies 添加开发依赖，重复的会直接覆盖
    * @param devDependency 开发依赖对象
    */
   public addDevDependency(devDependency: Record<string, string>): PackageJsonOps {
      if (!this.packageJsonData.devDependencies) {
         this.packageJsonData.devDependencies = {};
      }
      appendRecordToRecord(devDependency, this.packageJsonData.devDependencies);
      return this;
   }

   /**
    * 同时添加 dependencies 和 devDependencies
    * @param deps 包含 dependencies 和 devDependencies 的对象
    */
   public addBothDependencies(deps: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
   }): PackageJsonOps {
      if (deps.dependencies) {
         this.addDependency(deps.dependencies);
      }
      if (deps.devDependencies) {
         this.addDevDependency(deps.devDependencies);
      }
      return this;
   }

   /**
    * 向 peerDependencies 添加同伴依赖
    * @param peerDependency 同伴依赖对象
    */
   public addPeerDependency(peerDependency: Record<string, string>): PackageJsonOps {
      if (!this.packageJsonData.peerDependencies) {
         this.packageJsonData.peerDependencies = {};
      }
      appendRecordToRecord(peerDependency, this.packageJsonData.peerDependencies);
      return this;
   }

   /**
    * 向 scripts 添加脚本
    * @param script 脚本对象
    */
   public addScript(script: Record<string, string>): PackageJsonOps {
      if (!this.packageJsonData.scripts) {
         this.packageJsonData.scripts = {};
      }
      appendRecordToRecord(script, this.packageJsonData.scripts);
      return this;
   }

   /**
    * 设置 engines 字段
    * @param engines 引擎版本要求
    */
   public setEngines(engines: Record<string, string>): PackageJsonOps {
      if (!this.packageJsonData.engines) {
         this.packageJsonData.engines = {};
      }
      this.packageJsonData.engines = { ...this.packageJsonData.engines, ...engines };
      return this;
   }

   /**
    * 添加关键字
    * @param keywords 关键字数组
    */
   public addKeywords(keywords: string[]): PackageJsonOps {
      if (!this.packageJsonData.keywords) {
         this.packageJsonData.keywords = [];
      }
      this.packageJsonData.keywords = [...new Set([...this.packageJsonData.keywords, ...keywords])];
      return this;
   }

   /**
    * 获取当前的 package.json 数据
    */
   public getData(): PackageJson {
      return this.packageJsonData;
   }

   /**
    * 保存 package.json 文件，会按照标准顺序排序
    */
   public async save(): Promise<void> {
      const sorted = this.sortPackageJson(this.packageJsonData);
      await fs.writeJson(this.packageJsonPath, sorted, { spaces: 2 });
   }
}
