module.exports = {
  moduleDirectories: ["platform/node", "src", "node_modules"],
  moduleNameMapper: {
    "^d3$": "<rootDir>/node_modules/d3/dist/d3.min.js",
    "^change-case$": "<rootDir>/node_modules/change-case/dist/index.js",
    "^.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/config/jest/FileStub.js",
    "^.+\\.css$": "<rootDir>/config/jest/CSSStub.js"
  },
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./build/test-results",
        outputName: "jest-test-results.xml"
      }
    ]
  ],
  setupFiles: ["<rootDir>/config/polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  testEnvironment: "jsdom",
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(change-case|jsonpath-plus|title-case)/)"
  ]
}
