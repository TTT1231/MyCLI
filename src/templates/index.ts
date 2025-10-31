import type { TemplateConfig } from "../types";
// 预定义的模板
export const TEMPLATES: Record<string, TemplateConfig> = {
  "web-vue": {
    name: "web-vue",
    repository: "templates/web-vue",
    isLocal: true,
  },
  "electron-vue": {
    name: "electron-vue",
    repository: "github:TTT1231/electron-init",
  },
  node: {
    name: "Node.js",
    repository: "github:microsoft/TypeScript-Node-Starter",
  },
};

// 每个模板对应的工具选项
export const TEMPLATE_TOOLS: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  "web-vue": [
    { value: "eslint-prettier", label: "ESLint - Prettier代码格式化" },
    { value: "devtools", label: "DevTools - 开发工具配置" },
    { value: "tailwindcss", label: "TailwindCSS - CSS框架" },
    { value: "axios", label: "Axios - HTTP请求库" },
    { value: "pinia", label: "Pinia - 状态管理" },
    { value: "vue-router", label: "Vue Router - 路由管理" },
    { value: "vite-proxy", label: "Vite Proxy - 代理配置" },
    { value: "env", label: "env - 环境变量管理" },
    { value: "ant-design-vue", label: "Ant Design Vue - 组件库" },
  ],
  "electron-vue": [
    { value: "eslint", label: "ESLint - 代码检查工具" },
    { value: "prettier", label: "Prettier - 代码格式化工具" },
    { value: "tailwindcss", label: "TailwindCSS - CSS框架" },
    { value: "electron-builder", label: "Electron Builder - 打包工具" },
    { value: "auto-updater", label: "Auto Updater - 自动更新" },
    { value: "devtools", label: "DevTools - 开发工具配置" },
  ],
  node: [
    { value: "eslint", label: "ESLint - 代码检查工具" },
    { value: "prettier", label: "Prettier - 代码格式化工具" },
    { value: "jest", label: "Jest - 测试框架" },
    { value: "express", label: "Express - Web框架" },
    { value: "mongoose", label: "Mongoose - MongoDB ODM" },
    { value: "dotenv", label: "Dotenv - 环境变量管理" },
  ],
};
