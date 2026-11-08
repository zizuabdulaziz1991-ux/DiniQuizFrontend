module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'plugin:@typescript-eslint/recommended'],
  parser: 'vue-eslint-parser',
  parserOptions: { parser: '@typescript-eslint/parser', ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'error',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-self-closing': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
  },
}
