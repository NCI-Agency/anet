module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jquery: true
  },
  extends: [
    "plugin:chai-expect/recommended",
    "react-app",
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
    "flowtype",
    "import",
    "jsx-a11y",
    "n",
    "promise",
    "react",
    "react-hooks"
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
