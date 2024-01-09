import webpack from "webpack"
import paths from "../config/paths"

export default {
  core: {
    disableTelemetry: true
  },
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  staticDirs: ["../stories/dictionaryForStories"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-links",
    {
      name: "@storybook/addon-styling-webpack",
      options: {
        rules: [
          {
            test: /\.css$/,
            use: [
              "style-loader",
              {
                loader: "css-loader",
                options: { importLoaders: 1 }
              },
              {
                loader: "postcss-loader",
                options: { implementation: require.resolve("postcss") }
              }
            ]
          }
        ]
      }
    }
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },
  docs: {
    autodocs: false
  },
  webpackFinal: async(config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    config.resolve.modules = [
      "platform/storybook",
      paths.appSrc,
      "node_modules"
    ]
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify("development")
      })
    )
    return config
  }
}
