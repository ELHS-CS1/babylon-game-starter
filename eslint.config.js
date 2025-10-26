import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json', './src/client/tsconfig.json', './src/server/tsconfig.json'],
        projectService: true,
        extraFileExtensions: ['.ts', '.tsx'],
      },
      globals: {
        // Node.js globals for server files
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Browser globals for client files
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // === STRICT TYPE SAFETY RULES ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'never' // Disable type assertions completely
      }],
      
      // === PREVENT TYPE CASTING ===
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 10
      }],
      
      // === ENFORCE TYPE SAFETY ===
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      
      // === ENFORCE PROPER TYPING ===
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { 
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }],
      '@typescript-eslint/consistent-type-exports': ['error', { 
        fixMixedExportsWithInlineTypeSpecifier: false 
      }],
      
      // === PREVENT BAD PATTERNS ===
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/unbound-method': 'error',
      
      
      // === DEMO-SPECIFIC RULES ===
      'no-console': 'warn', // Allow console in demo code
    },
  },
  {
    // Override for main.ts - Vue component creation
    files: ['src/client/main.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off', // Allow createApp(App) with Vue components
    },
  },
  {
    // Vue files - strict Vue and Vuetify rules
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        parser: typescriptParser,
        project: ['./tsconfig.json', './src/client/tsconfig.json', './src/server/tsconfig.json'],
        projectService: true,
        extraFileExtensions: ['.vue'],
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals for Vue components
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
    plugins: {
      'vue': vue,
      '@typescript-eslint': typescript,
    },
    rules: {
      ...vue.configs.recommended.rules,
      
      // === VUETIFY STRICT STYLING RULES ===
      'no-restricted-syntax': [
        'error',
        // Inline CSS restrictions
        {
          selector: 'CallExpression[callee.property.name="setProperty"]',
          message: 'Inline CSS styles are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'AssignmentExpression[left.property.name="style"]',
          message: 'Inline CSS styles are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'MemberExpression[object.property.name="style"]',
          message: 'Direct style manipulation is not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'CallExpression[callee.property.name="setAttribute"][arguments.0.value="style"]',
          message: 'Inline CSS styles via setAttribute are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'CallExpression[callee.property.name="setAttribute"][arguments.0.value="class"]',
          message: 'Dynamic class manipulation should use Vuetify classes. Avoid custom CSS classes.'
        },
        // Template literal restrictions
        {
          selector: 'TemplateLiteral[quasis.0.value.raw*="style="]',
          message: 'Inline CSS in template literals is not allowed. Use Vuetify classes.'
        },
        {
          selector: 'TemplateLiteral[quasis.0.value.raw*="class="]',
          message: 'Custom CSS classes in template literals are not allowed. Use Vuetify classes.'
        },
        // DOM manipulation restrictions
        {
          selector: 'CallExpression[callee.name="createElement"][arguments.0.value="style"]',
          message: 'Creating style elements is not allowed. Use Vuetify components.'
        },
        // Vuetify-specific restrictions
        {
          selector: 'CallExpression[callee.name="createElement"][arguments.0.value="div"][arguments.1.properties.0.key.name="style"]',
          message: 'Creating div elements with inline styles is not allowed. Use Vuetify components.'
        },
        {
          selector: 'JSXAttribute[name.name="style"]',
          message: 'JSX style attributes are not allowed. Use Vuetify classes.'
        },
        {
          selector: 'JSXAttribute[name.name="className"][value.value*="custom-"]',
          message: 'Custom CSS classes in JSX are not allowed. Use Vuetify classes.'
        },
        // Vue template restrictions
        {
          selector: 'VAttribute[key.name="style"]',
          message: 'Inline CSS styles in Vue templates are not allowed. Use Vuetify classes.'
        },
        {
          selector: 'VAttribute[key.name="class"][value.value*="custom-"]',
          message: 'Custom CSS classes in Vue templates are not allowed. Use Vuetify utility classes.'
        },
        // CSS-in-JS restrictions
        {
          selector: 'ObjectExpression[properties.0.key.name="style"]',
          message: 'CSS-in-JS style objects are not allowed. Use Vuetify classes.'
        },
        {
          selector: 'Property[key.name="style"]',
          message: 'Style properties are not allowed. Use Vuetify classes.'
        },
        // Dynamic style binding restrictions
        {
          selector: 'VAttribute[key.name=":style"]',
          message: 'Dynamic style binding is not allowed. Use Vuetify classes with computed properties.'
        },
        {
          selector: 'VAttribute[key.name="v-bind:style"]',
          message: 'Dynamic style binding is not allowed. Use Vuetify classes with computed properties.'
        },
        // CSS variable restrictions
        {
          selector: 'CallExpression[callee.property.name="setProperty"][arguments.0.value*="--"]',
          message: 'CSS custom properties are not allowed. Use Vuetify theme system.'
        },
        // Animation restrictions
        {
          selector: 'CallExpression[callee.property.name="setProperty"][arguments.0.value*="animation"]',
          message: 'Custom animations are not allowed. Use Vuetify transitions.'
        },
        {
          selector: 'CallExpression[callee.property.name="setProperty"][arguments.0.value*="transition"]',
          message: 'Custom transitions are not allowed. Use Vuetify transitions.'
        }
      ],
      
      // === IMPORT RESTRICTIONS ===
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*.css', '*.scss', '*.sass', '*.less'],
              message: 'Custom CSS imports are not allowed. Use Vuetify styling system.'
            },
            {
              group: ['styled-components', 'emotion', '@emotion/*'],
              message: 'CSS-in-JS libraries are not allowed. Use Vuetify styling system.'
            },
            {
              group: ['tailwindcss', '@tailwindcss/*'],
              message: 'Tailwind CSS is not allowed. Use Vuetify utility classes.'
            },
            {
              group: ['bootstrap', '@bootstrap/*'],
              message: 'Bootstrap is not allowed. Use Vuetify components.'
            }
          ]
        }
      ],
      
      // === CUSTOM CSS CLASS RESTRICTIONS ===
      'no-restricted-globals': [
        'error',
        {
          name: 'document',
          message: 'Direct DOM manipulation is not allowed. Use Vuetify components.'
        }
      ],
      
      // === VUETIFY STRICT RULES ===
      'vue/no-v-html': 'error', // Prevent XSS vulnerabilities
      'vue/require-v-for-key': 'error',
      'vue/require-prop-types': 'error',
      'vue/require-default-prop': 'error',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error',
      'vue/no-mutating-props': 'error',
      'vue/no-side-effects-in-computed-properties': 'error',
      'vue/return-in-computed-property': 'error',
      'vue/no-async-in-computed-properties': 'error',
      'vue/no-dupe-keys': 'error',
      'vue/no-duplicate-attributes': 'error',
      'vue/no-parsing-error': 'error',
      'vue/no-reserved-keys': 'error',
      'vue/no-shared-component-data': 'error',
      'vue/no-template-key': 'error',
      'vue/no-textarea-mustache': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/require-component-is': 'error',
      'vue/require-render-return': 'error',
      'vue/require-valid-default-prop': 'error',
      'vue/use-v-on-exact': 'error',
      'vue/valid-template-root': 'error',
      'vue/valid-v-bind': 'error',
      'vue/valid-v-cloak': 'error',
      'vue/valid-v-else-if': 'error',
      'vue/valid-v-else': 'error',
      'vue/valid-v-for': 'error',
      'vue/valid-v-html': 'error',
      'vue/valid-v-if': 'error',
      'vue/valid-v-model': 'error',
      'vue/valid-v-on': 'error',
      'vue/valid-v-once': 'error',
      'vue/valid-v-pre': 'error',
      'vue/valid-v-show': 'error',
      'vue/valid-v-text': 'error',
      
      // === VUETIFY STYLING ENFORCEMENT ===
      'vue/block-lang': ['error', {
        script: { lang: 'ts' }
      }],
      
      // === VUETIFY COMPONENT RULES ===
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/custom-event-name-casing': ['error', 'camelCase'],
      'vue/define-macros-order': ['error', {
        order: ['defineProps', 'defineEmits']
      }],
      'vue/html-comment-content-spacing': ['error', 'always'],
      'vue/no-unused-refs': 'error',
      'vue/padding-line-between-blocks': ['error', 'always'],
      'vue/prefer-separate-static-class': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/html-self-closing': ['error', {
        html: {
          void: 'never',
          normal: 'always',
          component: 'always'
        },
        svg: 'always',
        math: 'always'
      }],
      
      // === STRICT TYPE SAFETY FOR VUE ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'never'
      }],
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  },
  {
    // HTML files - prevent inline styles
    files: ['**/*.html'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Attribute[name="style"]',
          message: 'Inline CSS styles are not allowed. Use Vuetify classes instead.'
        },
        {
          selector: 'Attribute[name="class"][value*="custom-"]',
          message: 'Custom CSS classes are not allowed. Use Vuetify utility classes.'
        }
      ]
    }
  },
  {
    // CSS files - prevent custom CSS entirely
    files: ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: '*',
          message: 'Custom CSS files are not allowed. Use Vuetify styling system.'
        }
      ]
    }
  },
  {
    // Playground files - strict TypeScript rules for Babylon.js Playground v2
    files: ['playground/**/*.ts'],
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./playground/tsconfig.json'],
        projectService: true,
        extraFileExtensions: ['.ts'],
      },
      globals: {
        // Browser globals for Babylon.js Playground
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        // BABYLON global is available in Playground v2
        BABYLON: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // === STRICT TYPE SAFETY RULES FOR PLAYGROUND ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'never' // Disable type assertions completely
      }],
      
      // === PREVENT TYPE CASTING ===
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 10
      }],
      
      // === ENFORCE TYPE SAFETY ===
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      
      // === ENFORCE PROPER TYPING ===
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { 
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }],
      '@typescript-eslint/consistent-type-exports': ['error', { 
        fixMixedExportsWithInlineTypeSpecifier: false 
      }],
      
      // === PREVENT BAD PATTERNS ===
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/unbound-method': 'error',
      
      // === PLAYGROUND-SPECIFIC RULES ===
      'no-console': 'error', // No console logs in playground
      'no-restricted-globals': ['error', {
        name: 'setTimeout',
        message: 'setTimeout is not allowed in playground. Use Babylon.js observables instead.'
      }, {
        name: 'setInterval', 
        message: 'setInterval is not allowed in playground. Use Babylon.js observables instead.'
      }]
    },
  },
  {
    // Test files - relaxed rules for testing
    files: ['tests/**/*', '**/*.test.ts', '**/*.spec.ts', 'scripts/**/*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },
  {
    ignores: [
      'dist/',
      'src/**/dist/',
      'node_modules/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '*.config.js',
      '*.config.ts',
      '**/*.d.ts',
      '**/*.js.map'
    ]
  }
];
