module.exports = {
  plugins: [
    require("postcss-custom-properties")({
      disableDeprecationNotice: true, // suppress endless deprecation warnings about "importFrom" and "exportTo"
      preserve: false, // completely reduce all css vars
      importFrom: [
        "src/fullcalendar-vars.css" // look here for the new values
      ]
    }),
    require("postcss-calc"),
    require("autoprefixer"),
    require("postcss-flexbugs-fixes")
  ]
}
