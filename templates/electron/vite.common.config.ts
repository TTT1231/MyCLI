import { resolve } from 'path';
const resolvePath = (relativePath: string) => resolve(__dirname, relativePath);
// 公共的别名配置
export const commonAlias = {
   '@shared': resolve(__dirname, 'src/shared'),
   '@resources': resolve(__dirname, 'resources'),
   '~~': resolvePath('./'),
};
