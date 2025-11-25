import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
   {
      files: ['**/*.{js,ts,mjs}'],
      ignores: ['eslint.config.mjs'], // 排除配置文件，根据实际情况进行添加
      languageOptions: {
         parser: tsParser,
         parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.json',
         },
      },
      plugins: {
         '@typescript-eslint': tsPlugin,
         prettier: prettierPlugin,
      },
      rules: {
         // 基础规则（自定义规则）
         semi: ['error', 'always'],
         quotes: ['error', 'single'],
         'comma-dangle': ['error', 'always-multiline'],
         'no-console': 'off',

         // TypeScript 规则
         '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         '@typescript-eslint/no-explicit-any': 'warn',

         // Import/Export 类型规则
         '@typescript-eslint/consistent-type-imports': [
            'error',
            {
               prefer: 'type-imports',
               disallowTypeAnnotations: false,
            },
         ],
         '@typescript-eslint/consistent-type-exports': [
            'error',
            {
               fixMixedExportsWithInlineTypeSpecifier: true,
            },
         ],

         // Prettier 集成
         'prettier/prettier': 'error', //prettier错误也提示，避免因为风格问题导致的代码提交
      },
   },
   prettierConfig, // 禁用与 Prettier 冲突的规则，必须放在最后
   {
      ignores: ['node_modules/**', 'dist/**', 'esbuild.config.mjs'], //全局配置，对整个项目生效
   },
];
