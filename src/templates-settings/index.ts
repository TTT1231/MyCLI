import type { TemplateConfig } from '../types';
// 预定义的模板
export const TEMPLATES: Record<string, TemplateConfig> = {
   'web-vue': {
      name: 'web-vue',
      repository: 'templates/web-vue',
      isLocal: true,
   },
   'electron-vue': {
      name: 'electron-vue',
      repository: 'templates/electron',
      isLocal: true,
   },
   node: {
      name: 'Node.js',
      repository: 'templates/node',
      isLocal: true,
   },
};

// 每个模板对应的工具选项
export const TEMPLATE_TOOLS: Record<string, Array<{ value: string; label: string }>> = {
   'web-vue': [
      { value: 'eslint-prettier', label: 'ESLint - Prettier代码格式化' },
      { value: 'devtools', label: 'DevTools - 开发工具配置' },
      { value: 'tailwindcss', label: 'TailwindCSS - CSS框架' },
      { value: 'axios', label: 'Axios - HTTP请求库' },
      { value: 'pinia', label: 'Pinia - 状态管理' },
      { value: 'vue-router', label: 'Vue Router - 路由管理' },
      { value: 'vite-proxy', label: 'Vite Proxy - 代理配置' },
      { value: 'env', label: 'env - 环境变量管理' },
      { value: 'scss', label: 'SCSS - 样式预处理器' },
      { value: 'ant-design-vue', label: 'Ant Design Vue - 组件库' },
   ],
   'electron-vue': [
      //TODO 占位，还未配置
   ],
   node: [
      //TODO 占位，还未配置
   ],
};
