module.exports = {
  env: {
    test: {
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }
  },
  presets: ["react-app"],
  plugins: [
    [
      "@babel/plugin-proposal-decorators",
      {
        legacy: true
      }
    ],
    "@babel/plugin-transform-proto-to-assign",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    [
      "@babel/plugin-proposal-class-properties",
      {
        loose: true
      }
    ],
    "@babel/plugin-proposal-json-strings",
    "@babel/plugin-proposal-function-sent",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-numeric-separator",
    "@babel/plugin-proposal-throw-expressions",
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-logical-assignment-operators",
    "@babel/plugin-proposal-optional-chaining",
    [
      "@babel/plugin-proposal-pipeline-operator",
      {
        proposal: "minimal"
      }
    ],
    "@babel/plugin-proposal-nullish-coalescing-operator",
    "@babel/plugin-proposal-do-expressions"
  ]
}
