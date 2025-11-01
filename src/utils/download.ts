import downloadGitRepo from 'download-git-repo';
import { promisify } from 'util';
import path from 'path';
import { TemplateConfig } from '../types';
import { ensureDir, pathExists, emptyDir, copyDir } from './file-ops/baseFileOps';

const download = promisify(downloadGitRepo) as (
   repository: string,
   destination: string,
   options?: boolean | { clone?: boolean },
) => Promise<void>;

export interface DownloadOptions {
   clone?: boolean;
   onProgress?: (progress: { current: number; total: number; percentage: number }) => void;
}

export async function downloadTemplate(
   template: TemplateConfig,
   targetDir: string,
   options: DownloadOptions = {},
): Promise<void> {
   const { repository, branch = 'main', directory, isLocal } = template;

   // 确保目标目录存在
   await ensureDir(targetDir);

   // 如果是本地模板，直接复制文件
   if (isLocal) {
      // 使用dist目录中的模板 (从dist/utils向上一级到dist目录)
      const distRoot = path.resolve(__dirname, '../');
      const templatePath = path.join(distRoot, repository);

      // 检查本地模板是否存在
      if (!(await pathExists(templatePath))) {
         throw new Error(`本地模板不存在: ${templatePath}`);
      }

      // 模拟进度更新
      if (options.onProgress) {
         const progressSteps = [20, 40, 60, 80, 100];
         let currentStep = 0;

         const progressInterval = setInterval(() => {
            if (currentStep < progressSteps.length) {
               const progress = progressSteps[currentStep];
               options.onProgress!({
                  current: progress,
                  total: 100,
                  percentage: progress,
               });
               currentStep++;
            }
         }, 100);

         try {
            await copyDir(templatePath, targetDir);
            clearInterval(progressInterval);
            // 确保显示100%完成
            options.onProgress({
               current: 100,
               total: 100,
               percentage: 100,
            });
         } catch (error) {
            clearInterval(progressInterval);
            throw new Error(
               `复制本地模板失败: ${error instanceof Error ? error.message : String(error)}`,
            );
         }
      } else {
         try {
            await copyDir(templatePath, targetDir);
         } catch (error) {
            throw new Error(
               `复制本地模板失败: ${error instanceof Error ? error.message : String(error)}`,
            );
         }
      }
      return;
   }

   // 远程模板下载逻辑
   // 构建下载地址
   let downloadUrl = repository;
   if (branch && branch !== 'main') {
      downloadUrl += `#${branch}`;
   }

   // 如果指定了子目录，需要特殊处理
   if (directory) {
      downloadUrl += `:${directory}`;
   }

   // 模拟进度更新（因为download-git-repo不支持真实进度回调）
   if (options.onProgress) {
      const progressSteps = [10, 30, 50, 70, 90, 100];
      let currentStep = 0;

      const progressInterval = setInterval(() => {
         if (currentStep < progressSteps.length - 1) {
            const progress = progressSteps[currentStep];
            options.onProgress!({
               current: progress,
               total: 100,
               percentage: progress,
            });
            currentStep++;
         }
      }, 200);

      try {
         await download(downloadUrl, targetDir, { clone: options.clone || false });
         clearInterval(progressInterval);
         // 确保显示100%完成
         options.onProgress({
            current: 100,
            total: 100,
            percentage: 100,
         });
      } catch (error) {
         clearInterval(progressInterval);
         throw new Error(`下载模板失败: ${error instanceof Error ? error.message : String(error)}`);
      }
   } else {
      try {
         await download(downloadUrl, targetDir, { clone: options.clone || false });
      } catch (error) {
         throw new Error(`下载模板失败: ${error instanceof Error ? error.message : String(error)}`);
      }
   }
}

export async function downloadFromGitHub(
   repo: string,
   targetDir: string,
   branch = 'main',
): Promise<void> {
   const template: TemplateConfig = {
      name: 'custom',
      repository: `github:${repo}`,
      branch,
   };

   await downloadTemplate(template, targetDir);
}

export function parseGitHubUrl(
   url: string,
): { owner: string; repo: string; branch?: string } | null {
   // 支持多种GitHub URL格式
   const patterns = [
      /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/,
      /^github:([^\/]+)\/([^\/]+)(?:#(.+))?/,
      /^([^\/]+)\/([^\/]+)(?:#(.+))?$/,
   ];

   for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
         return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, ''),
            branch: match[3] || 'main',
         };
      }
   }

   return null;
}

export function isGitHubUrl(url: string): boolean {
   return parseGitHubUrl(url) !== null;
}
