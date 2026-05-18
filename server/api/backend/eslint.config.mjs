import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
   { ignores: ['dist/**', 'node_modules/**'] },
   eslint.configs.recommended,
   ...tseslint.configs.recommended,
   eslintConfigPrettier,
   {
      rules: {
         '@typescript-eslint/explicit-function-return-type': 'error',
         '@typescript-eslint/explicit-module-boundary-types': 'error',
         '@typescript-eslint/no-explicit-any': 'off',
         '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
         'indent': ['error', 3],
         'linebreak-style': ['error', 'unix'],
         'quotes': ['error', 'single'],
         'semi': ['error', 'always'],
         'no-console': 'warn',
         'no-unused-vars': 'off',
      },
   },
);
