# 结构

your-electron-project/
├── src/
│ ├── main/ # 主进程代码
│ │ ├── index.ts # 主进程入口文件
│ ├── preload/ # 预加载脚本
│ │ ├── index.ts # 预加载入口
│ ├── renderer/ # 渲染进程代码
│ │ ├── main.ts # 渲染进程入口
│ │ ├── App.vue # 主应用组件
│ │ └── ...
│ └── shared/ # 共享代码
├── resources/ # 资源文件
└── dist/ # 构建输出
