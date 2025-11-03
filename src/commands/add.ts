import path from 'path';
import { ensureDir } from '../utils/file-ops';
import { copy } from 'fs-extra';

export async function addVscodeSettings() {
   const rootDir = path.resolve(process.cwd());
   const vscodeSettingsPathSrc = path.resolve(__dirname, '../resources/.vscode');
   const vscodeSettingsPathDest = path.join(rootDir, '.vscode');

   await ensureDir(vscodeSettingsPathSrc); // 确保源目录存在

   copy(vscodeSettingsPathSrc, vscodeSettingsPathDest)
      .then(() => {
         console.log('.vscode 编译器爱好配置成功');
      })
      .catch(() => {
         throw new Error('添加 .vscode 配置失败：');
      });
}
