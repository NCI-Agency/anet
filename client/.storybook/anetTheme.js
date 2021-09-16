import { create } from "@storybook/theming"
import anetLogo from "../stories/assets/logo.svg"

export default create({
  /**
   * The styles below could be used in the future.
   * Left as commented out intentionally.
   */

  base: "light",

  // colorPrimary: "hotpink",
  // colorSecondary: "deepskyblue",

  // UI
  appBg: "white",
  appContentBg: "white",
  appBorderColor: "white",
  appBorderRadius: 4,

  // Typography
  // fontBase: '"Open Sans", sans-serif',
  // fontCode: "monospace",

  // Text colors
  // textColor: "black",
  // textInverseColor: "rgba(255,255,255,0.9)",

  // Toolbar default and active colors
  // barTextColor: "silver",
  // barSelectedColor: "black",
  // barBg: "hotpink",

  // Form colors
  // inputBg: "white",
  // inputBorder: "silver",
  // inputTextColor: "black",
  // inputBorderRadius: 4,

  brandTitle: "ANET Storybook",
  brandImage: anetLogo
})
