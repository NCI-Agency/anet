const { defineConfig, globalIgnores } = require("eslint/config")
const neostandard = require("neostandard")

const globals = require("globals")
const babelParser = require("@babel/eslint-parser")
const chaiExpect = require("eslint-plugin-chai-expect")
const _import = require("eslint-plugin-import")
const jest = require("eslint-plugin-jest")
const jsxA11Y = require("eslint-plugin-jsx-a11y")
const react = require("eslint-plugin-react")
const reactHooks = require("eslint-plugin-react-hooks")
const eslintConfigPrettier = require("eslint-config-prettier")

const tsParser = require("@typescript-eslint/parser")
const typescriptEslint = require("@typescript-eslint/eslint-plugin")

module.exports = defineConfig([
  ...neostandard({
    noJSX: false
  }),

  {
    settings: {
      react: {
        version: "18"
      }
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...jest.environments.globals.globals,
        ...globals.jquery,
        browser: "readonly"
      },
      parser: babelParser
    },
    plugins: {
      "chai-expect": chaiExpect,
      import: _import,
      jest,
      "jsx-a11y": jsxA11Y,
      react,
      "react-hooks": reactHooks
    },
    rules: {
      ...chaiExpect.configs.recommended.rules,
      ...react.configs.recommended.rules,

      eqeqeq: [
        "error",
        "always",
        {
          null: "ignore"
        }
      ],
      "import/no-anonymous-default-export": "off",
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index"
          ]
        }
      ],
      "multiline-ternary": "off",
      quotes: [
        "warn",
        "double",
        {
          avoidEscape: true
        }
      ],
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/jsx-handler-names": "off",
      "react/no-did-update-set-state": "warn",
      curly: ["error", "all"]
    }
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser
    },
    plugins: {
      "@typescript-eslint": typescriptEslint
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-spread": "warn"
    }
  },

  eslintConfigPrettier,

  globalIgnores(["**/build/", "**/node_modules/"])
])
