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
    "standard-react"
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
        "prefer-spread": "warn",
        "react/prop-types": "warn"
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
    indent: [
      "warn",
      2,
      {
        SwitchCase: 1,
        ignoredNodes: [
          "JSXElement",
          "JSXElement > *",
          "JSXAttribute",
          "JSXIdentifier",
          "JSXNamespacedName",
          "JSXMemberExpression",
          "JSXSpreadAttribute",
          "JSXExpressionContainer",
          "JSXOpeningElement",
          "JSXClosingElement",
          "JSXOpeningFragment",
          "JSXOpeningFragment",
          "JSXClosingFragment",
          "JSXText",
          "JSXEmptyExpression",
          "JSXSpreadChild"
        ]
      }
    ],
    "jsx-quotes": ["warn", "prefer-double"],
    "multiline-ternary": "off",
    "quote-props": ["warn", "as-needed"],
    quotes: [
      "warn",
      "double",
      {
        avoidEscape: true
      }
    ],
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react/jsx-closing-bracket-location": "warn",
    "react/jsx-closing-tag-location": "warn",
    "react/jsx-handler-names": "off",
    "react/jsx-indent": ["warn", 2],
    "react/jsx-indent-props": ["warn", 2],
    "react/no-did-update-set-state": "warn",
    semi: ["warn", "never"],
    "space-before-function-paren": ["warn", "never"],
    curly: ["error", "all"],
    "brace-style": [
      "error",
      "1tbs",
      {
        allowSingleLine: false
      }
    ]
  }
}
