module.exports = {
  moduleDirectories: ["platform/node", "src", "node_modules"],
  moduleNameMapper: {
    "^d3$": "<rootDir>/node_modules/d3/dist/d3.min.js",
    "^.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/config/jest/FileStub.cjs",
    "^.+\\.css$": "<rootDir>/config/jest/CSSStub.cjs"
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
  setupFiles: ["<rootDir>/config/polyfills.cjs"],
  setupFilesAfterEnv: ["<rootDir>/jest-setup.cjs"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(m?js|jsx)$": "babel-jest",
    "^.+\\.(ts|tsx)?$": "ts-jest"
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(change-case|geographiclib-mgrs|jsonpath-plus|react-resize-detector|title-case|uuid)/)"
  ]
}
