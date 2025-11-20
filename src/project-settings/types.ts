export interface RequireDependencies {
   dependencies?: Record<string, string>;
   devDependencies?: Record<string, string>;
}

// add 命令配置
export const ADD_CONFIGS = {
   vscode: {
      name: 'VSCode 配置',
      description: '添加 VSCode 编辑器配置',
   },
   // 未来可以扩展更多配置
} as const;

export type AddConfigType = keyof typeof ADD_CONFIGS;
