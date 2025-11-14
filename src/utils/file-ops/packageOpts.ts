import fs from 'fs-extra';
import path from 'path';

//向record追加内容
export function appendRecord(key: string, value: string, record: Record<string, string>): void {
   record[key] = value;
}

// 向目标 record 追加另一个 record 的键值对（重复键会覆盖）
export function appendRecordToRecord(
   source: Record<string, string>,
   target: Record<string, string>,
): void {
   // 遍历源记录，将所有键值对添加到目标记录中
   for (const [key, value] of Object.entries(source)) {
      target[key] = value;
   }
}

/**
 * 更新 package.json 文件中的 name 属性
 * - 如果 name 属性存在则替换其值
 * - 如果 name 属性不存在则添加到文件开头
 * @param filePath - package.json 文件的路径，包含文件后缀 .json
 * @param newName - 要设置的 name 值
 */
export async function updatePackageName(filePath: string, newName: string): Promise<void> {
   const encoding = 'utf8';
   const absPath = path.resolve(filePath);

   // 读取 package.json
   const content = await fs.readFile(absPath, encoding);
   const packageJson = JSON.parse(content);

   // 删除旧的 name 属性（如果存在）
   delete packageJson.name;

   // 创建新对象，将 name 放在最前面
   const newPackageJson = {
      name: newName,
      ...packageJson,
   };

   // 写回文件，保持格式化（3个空格缩进）
   await fs.writeFile(absPath, JSON.stringify(newPackageJson, null, 3) + '\n', encoding);
}
