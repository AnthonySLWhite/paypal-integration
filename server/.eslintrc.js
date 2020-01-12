module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ['airbnb-base'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'import/no-unresolved': 0,
    'import/prefer-default-export': 0,
    camelcase: 0,
    'import/extensions': 0,
    'no-use-before-define': 0,
    'arrow-parens': [0, 'as-needed'],
  },
};
