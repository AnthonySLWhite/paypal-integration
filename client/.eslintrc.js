module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  parser: 'babel-eslint',
  extends: ['plugin:react/recommended', 'airbnb'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    'react/jsx-filename-extension': 0,
    'arrow-parens': [1, 'as-needed'],
    'import/no-unresolved': 0,
    'import/prefer-default-export': 0,
    'no-use-before-define': 0,
    'react/state-in-constructor': 0,
    'react/prop-types': 0,
    'import/extensions': 0,
    'react/jsx-one-expression-per-line': 0,
  },
};
