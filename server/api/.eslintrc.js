module.exports = {
   parser: '@typescript-eslint/parser',
   parserOptions: {
      project: 'tsconfig.json',
      sourceType: 'module',
   },
   plugins: ['@typescript-eslint/eslint-plugin'],
   extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
   root: true,
   env: {
      node: true,
      jest: true,
   },
   ignorePatterns: ['.eslintrc.js'],
   rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      indent: ['error', 3],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
   },
};
