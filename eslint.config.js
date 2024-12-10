import typescriptEslint from '@typescript-eslint/eslint-plugin';
import lit from 'eslint-plugin-lit';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:lit/recommended',
    'plugin:prettier/recommended'
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      lit,
      prettier
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },

      parser: tsParser,
      ecmaVersion: 2018,
      sourceType: 'module'
    },

    rules: {
      'prettier/prettier': 'error',
      'lit/attribute-value-entities': 'off',
      'lit/no-legacy-template-syntax': 'off',
      'linebreak-style': 'off',

      'no-irregular-whitespace': [
        'error',
        {
          skipTemplates: true
        }
      ],

      '@typescript-eslint/no-object-literal-type-assertion': 'off',
      'padded-blocks': 'off',
      'brace-style': 'off',

      'new-cap': [
        'error',
        {
          capIsNewExceptions: ['GestureEventListeners'],
          capIsNewExceptionPattern: '^Etools..|..Mixin$'
        }
      ],

      'no-var': 'off',
      'require-jsdoc': 'off',
      'valid-jsdoc': 'off',
      'comma-dangle': ['error', 'never'],

      'max-len': [
        'error',
        {
          code: 120,
          ignoreUrls: true
        }
      ],

      'prefer-promise-reject-errors': 'off',
      camelcase: 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',

      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true
        }
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_'
        }
      ]
    }
  }
];
