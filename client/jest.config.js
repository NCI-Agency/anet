module.exports = {
  moduleDirectories: ["platform/node", "src", "node_modules"],
  moduleFileExtensions: ["jsx", "js", "json"],
  moduleNameMapper: {
    "^d3$": "<rootDir>/node_modules/d3/dist/d3.min.js",
    "^jsonpath-plus$":
      "<rootDir>/node_modules/jsonpath-plus/dist/index-node-cjs.cjs",
    "^uuid$": "<rootDir>/node_modules/uuid/dist/index.js",
    "^.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/config/jest/FileStub.js",
    "^.+\\.css$": "<rootDir>/config/jest/CSSStub.js"
  },
  setupFiles: ["<rootDir>/config/polyfills.js"],
  testPathIgnorePatterns: ["<rootDir>/(build|docs|node_modules)/"],
  testEnvironment: "jsdom"
}
