import fs from 'fs-extra';
import path from 'path';

/**
 * 将 HTML 文件中的 <title>...</title> 替换为指定的 title 文本。
 * - 如果存在 <title> 标签则替换其内容。
 * - 如果不存在但有 </head>，则在 </head> 之前插入 <title>。
 * @param filePath - HTML 文件的路径,包含文件后缀.html。
 * @param newTitle 要替换的值
 */
async function updateHtmlTitle(filePath: string, newTitle: string): Promise<void> {
   const encoding = 'utf8';
   const absPath = path.resolve(filePath);
   const content = await fs.readFile(absPath, encoding);
   const titleRegex = /<title[^>]*>[\s\S]*?<\/title>/i;
   let newContent: string;

   const escaped = escapeHtml(newTitle);

   if (titleRegex.test(content)) {
      newContent = content.replace(titleRegex, `<title>${escaped}</title>`);
   } else if (/\<\/head\>/i.test(content)) {
      newContent = content.replace(/<\/head>/i, `<title>${escaped}</title>\n</head>`);
   } else if (/\<head[^>]*\>/i.test(content)) {
      newContent = content.replace(
         /<head[^>]*>/i,
         match => `${match}\n  <title>${escaped}</title>`,
      );
   } else {
      newContent = `<title>${escaped}</title>\n` + content;
   }

   await fs.writeFile(absPath, newContent, encoding);
}
function escapeHtml(s: string): string {
   return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
}

export { updateHtmlTitle };
