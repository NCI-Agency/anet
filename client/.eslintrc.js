module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    "jest/globals": true,
    jquery: true
  },
  extends: [
    "eslint:recommended",
    "plugin:chai-expect/recommended",
    "plugin:react/recommended",
    "standard",
    "standard-jsx",
    "standard-react",
    // Disable rules that interfere with prettier formatting:
    "prettier"
  ],
  globals: {
    browser: "readonly"
  },
  parser: "@babel/eslint-parser",
  plugins: [
    "chai-expect",
    "import",
    "jest",
    "jsx-a11y",
    "n",
    "promise",
    "react",
    "react-hooks"
  ],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      extends: ["plugin:@typescript-eslint/recommended"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-namespace": "warn",
        "@typescript-eslint/no-unused-expressions": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "prefer-spread": "warn"
      }
    }
  ],
  rules: {
    eqeqeq: ["error", "always", { null: "ignore" }],
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
}
