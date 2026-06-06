import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/out/**',
      '**/coverage/**',
      '**/storage/**',
      '**/postgres-data/**',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
          defaultProject: 'tsconfig.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 禁止 any（README §12 / CONTRIBUTING §1）
      '@typescript-eslint/no-explicit-any': 'error',
      // 禁止未处理的 Promise（CONTRIBUTING §1）
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // 强制类型导入
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // 未使用变量（_ 前缀豁免）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // 禁止 console（业务代码用 Pino）
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // 一致性
      eqeqeq: ['error', 'always'],
      'no-throw-literal': 'error',
    },
  },
  {
    // 配置 / 脚本文件放宽
    files: ['**/*.config.{js,mjs,cjs,ts,mts}', '**/scripts/**/*.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  prettier,
);
