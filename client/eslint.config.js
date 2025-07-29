const { defineConfig, globalIgnores } = require("eslint/config")

const globals = require("globals")
const babelParser = require("@babel/eslint-parser")
const chaiExpect = require("eslint-plugin-chai-expect")
const _import = require("eslint-plugin-import")
const jest = require("eslint-plugin-jest")
const jsxA11Y = require("eslint-plugin-jsx-a11y")
const n = require("eslint-plugin-n")
const promise = require("eslint-plugin-promise")
const react = require("eslint-plugin-react")
const reactHooks = require("eslint-plugin-react-hooks")

const tsParser = require("@typescript-eslint/parser")
const typescriptEslint = require("@typescript-eslint/eslint-plugin")
const js = require("@eslint/js")

const { FlatCompat } = require("@eslint/eslintrc")

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

module.exports = defineConfig([
  {
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
    extends: compat.extends(
      "eslint:recommended",
      "plugin:chai-expect/recommended",
      "plugin:react/recommended",
      "standard",
      "standard-jsx",
      "standard-react",
      "prettier"
    ),
    plugins: {
      "chai-expect": chaiExpect,
      import: _import,
      jest,
      "jsx-a11y": jsxA11Y,
      n,
      promise,
      react,
      "react-hooks": reactHooks
    },
    rules: {
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
    extends: compat.extends("plugin:@typescript-eslint/recommended"),
    languageOptions: {
      parser: tsParser
    },
    plugins: {
      "@typescript-eslint": typescriptEslint
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-spread": "warn"
    }
  },
  globalIgnores(["**/build/", "**/node_modules/"])
])
