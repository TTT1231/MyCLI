import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import vueParser from 'vue-eslint-parser';

export default [
   // 全局忽略配置
   {
      ignores: [
         'eslint.config.mjs',
         'node_modules/**',
         'dist/**',
         '.vite/**',
         'out/**',
         '*.config.{js,ts,mjs}',
         'forge.config.ts',
         'vite.*.config.ts',
         'forge.env.d.ts',
      ],
   },

   // 主进程相关文件配置
   {
      files: ['src/main/**/*.ts', 'src/shared/**/*.ts'],
      languageOptions: {
         parser: tsParser,
         parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.node.json',
         },
         globals: {
            // Node.js 全局变量
            process: 'readonly',
            Buffer: 'readonly',
            global: 'readonly',
            __dirname: 'readonly',
            __filename: 'readonly',
         },
      },
      plugins: {
         '@typescript-eslint': tsPlugin,
         prettier: prettierPlugin,
         import: importPlugin,
      },
      rules: {
         // 基础规则
         semi: ['error', 'always'],
         quotes: ['error', 'single'],
         'comma-dangle': ['error', 'always-multiline'],
         'no-console': 'off',

         // TypeScript 规则
         '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         '@typescript-eslint/no-explicit-any': 'warn',
         '@typescript-eslint/explicit-function-return-type': 'off',
         '@typescript-eslint/explicit-module-boundary-types': 'off',

         // 导入规则
         'import/order': [
            'error',
            {
               groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
               'newlines-between': 'always',
            },
         ],
         'import/no-unresolved': 'off',

         // Prettier 规则
         'prettier/prettier': 'error',
      },
      settings: {
         'import/resolver': {
            typescript: {
               alwaysTryTypes: true,
               project: './tsconfig.node.json',
            },
         },
      },
   },

   // 预加载脚本配置
   {
      files: ['src/preload/**/*.ts'],
      languageOptions: {
         parser: tsParser,
         parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.preload.json',
         },
         globals: {
            // Node.js 全局变量
            process: 'readonly',
            Buffer: 'readonly',
            global: 'readonly',
            __dirname: 'readonly',
            __filename: 'readonly',
         },
      },
      plugins: {
         '@typescript-eslint': tsPlugin,
         prettier: prettierPlugin,
         import: importPlugin,
      },
      rules: {
         // 基础规则
         semi: ['error', 'always'],
         quotes: ['error', 'single'],
         'comma-dangle': ['error', 'always-multiline'],
         'no-console': 'off',

         // TypeScript 规则
         '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         '@typescript-eslint/no-explicit-any': 'warn',
         '@typescript-eslint/explicit-function-return-type': 'off',
         '@typescript-eslint/explicit-module-boundary-types': 'off',

         // 导入规则
         'import/order': [
            'error',
            {
               groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
               'newlines-between': 'always',
            },
         ],
         'import/no-unresolved': 'off',

         // Prettier 规则
         'prettier/prettier': 'error',
      },
      settings: {
         'import/resolver': {
            typescript: {
               alwaysTryTypes: true,
               project: './tsconfig.preload.json',
            },
         },
      },
   },

   // 渲染进程 TypeScript 文件配置
   {
      files: ['src/renderer/**/*.{ts,js}'],
      languageOptions: {
         parser: tsParser,
         parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.app.json',
         },
         globals: {
            // 浏览器全局变量（渲染进程）
            window: 'readonly',
            document: 'readonly',
            console: 'readonly',
            // Vue 全局变量
            defineProps: 'readonly',
            defineEmits: 'readonly',
            defineExpose: 'readonly',
            withDefaults: 'readonly',
         },
      },
      plugins: {
         '@typescript-eslint': tsPlugin,
         prettier: prettierPlugin,
         import: importPlugin,
      },
      rules: {
         // 基础规则
         semi: ['error', 'always'],
         quotes: ['error', 'single'],
         'comma-dangle': ['error', 'always-multiline'],
         'no-console': 'off',

         // TypeScript 规则
         '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         '@typescript-eslint/no-explicit-any': 'warn',
         '@typescript-eslint/explicit-function-return-type': 'off',
         '@typescript-eslint/explicit-module-boundary-types': 'off',

         // Import/Export 类型规则 - 在Vue文件中禁用，因为没有project配置
         '@typescript-eslint/consistent-type-imports': 'off',

         // Import 规则
         'import/order': [
            'error',
            {
               groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
               'newlines-between': 'always',
            },
         ],
         'import/no-unresolved': 'off',

         // Prettier 集成
         'prettier/prettier': 'error',
      },
      settings: {
         'import/resolver': {
            typescript: {
               alwaysTryTypes: true,
               // 移除project配置以避免解析问题
               // project: './tsconfig.app.json',
            },
         },
      },
   },

   // Vue 文件配置
   {
      files: ['src/renderer/**/*.vue'],
      languageOptions: {
         parser: vueParser,
         parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: tsParser,
            extraFileExtensions: ['.vue'],
            // 移除 project 配置以避免 TypeScript 类型检查问题
            // project: './tsconfig.app.json',
         },
         globals: {
            // 浏览器全局变量（渲染进程）
            window: 'readonly',
            document: 'readonly',
            console: 'readonly',
            // Vue 全局变量
            defineProps: 'readonly',
            defineEmits: 'readonly',
            defineExpose: 'readonly',
            withDefaults: 'readonly',
         },
      },
      plugins: {
         '@typescript-eslint': tsPlugin,
         prettier: prettierPlugin,
         import: importPlugin,
      },
      rules: {
         // 基础规则
         semi: ['error', 'always'],
         quotes: ['error', 'single'],
         'comma-dangle': ['error', 'always-multiline'],
         'no-console': 'off',

         // TypeScript 规则
         '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
         '@typescript-eslint/no-explicit-any': 'warn',
         '@typescript-eslint/explicit-function-return-type': 'off',
         '@typescript-eslint/explicit-module-boundary-types': 'off',

         // Import/Export 类型规则
         '@typescript-eslint/consistent-type-imports': [
            'error',
            {
               prefer: 'type-imports',
               disallowTypeAnnotations: false,
            },
         ],

         // Import 规则
         'import/order': [
            'error',
            {
               groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
               'newlines-between': 'always',
            },
         ],
         'import/no-unresolved': 'off',

         // Prettier 集成
         'prettier/prettier': 'error',
      },
      settings: {
         'import/resolver': {
            typescript: {
               alwaysTryTypes: true,
               project: './tsconfig.app.json',
            },
         },
      },
   },

   prettierConfig, // 禁用与 Prettier 冲突的规则，必须放在最后
];
