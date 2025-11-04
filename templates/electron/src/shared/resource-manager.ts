import { resolve } from 'path';

/**
 * 资源管理器，主进程、preload、utillity进程使用
 * 渲染进程使用，必须由主进程暴露使用
 */
export class ResourceManager {
   /**
    * 获取共享资源路径（主进程/Preload使用）
    * @param relativePath 相对路径
    * @returns 绝对路径
    */
   static getSharedResourcePath(relativePath: string): string {
      if (process.env.NODE_ENV === 'development') {
         // 开发环境：从当前工作目录访问resources
         return resolve(process.cwd(), 'resources/shared', relativePath);
      } else {
         // 生产环境：process.resourcesPath已经指向resources目录
         return resolve(
            (process as NodeJS.Process & { resourcesPath: string }).resourcesPath,
            'shared',
            relativePath,
         );
      }
   }

   /**
    * 读取共享配置文件（主进程/Preload使用）
    * @param configName 配置文件名
    * @returns 配置对象
    */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   static async loadSharedConfig<T = any>(configName: string): Promise<T> {
      const fs = await import('fs/promises');
      const configPath = this.getSharedResourcePath(`${configName}`);
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
   }
}
