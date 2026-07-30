import corejsPackage from "core-js/package.json" with { type: "json" }

export default {
  env: {
    test: {
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }
  },
  presets: [
    [
      "@babel/preset-env",
      {
        corejs: corejsPackage.version
      }
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic"
      }
    ]
  ],
  plugins: [
    [
      "@babel/plugin-proposal-decorators",
      {
        version: "2023-11"
      }
    ],
    "@babel/plugin-proposal-do-expressions",
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-function-sent",
    [
      "@babel/plugin-proposal-pipeline-operator",
      {
        proposal: "fsharp"
      }
    ],
    "@babel/plugin-proposal-throw-expressions",
    "@babel/plugin-transform-class-properties",
    "@babel/plugin-transform-class-static-block",
    "@babel/plugin-transform-export-namespace-from",
    "@babel/plugin-transform-json-strings",
    "@babel/plugin-transform-logical-assignment-operators",
    "@babel/plugin-transform-nullish-coalescing-operator",
    "@babel/plugin-transform-numeric-separator",
    "@babel/plugin-transform-optional-chaining",
    "@babel/plugin-transform-private-property-in-object",
    "@babel/plugin-transform-proto-to-assign",
    "@babel/plugin-transform-runtime"
  ]
}
