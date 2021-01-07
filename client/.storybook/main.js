const paths = require("../config/paths")

module.exports = {
  stories: [
    "../stories/*.stories.mdx",
    "../stories/*.stories.@(js|jsx|ts|tsx)"
  ],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    config.resolve.modules = [
      "platform/storybook",
      paths.appSrc,
      "node_modules"
    ]

    /**
     * CSS handling, specifically overriding postcss loader
     * since storybook's own postcss dep is always behind and always causing errors
     */
    // Find the only Storybook webpack rule that tests for css
    const cssRule = config.module.rules.find(rule =>
      "test.css".match(rule.test)
    )
    // Which loader in this rule mentions the custom Storybook postcss-loader?
    const loaderIndex = cssRule.use.findIndex(loader => {
      // Loaders can be strings or objects
      const loaderString = typeof loader === "string" ? loader : loader.loader
      // Find the first mention of "postcss-loader", it may be in a string like:
      // "@storybook/core/node_modules/postcss-loader"
      return loaderString.includes("postcss-loader")
    })
    // Simple loader string form, removes the obsolete "options" key
    cssRule.use[loaderIndex] = "postcss-loader"

    // Return the altered config
    return config
  }
}
