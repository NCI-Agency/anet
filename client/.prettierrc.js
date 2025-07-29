module.exports = {
  arrowParens: "avoid",
  importOrder: ["@fullcalendar/react", "^[^.]", "^[./]"],
  importOrderCaseSensitive: false,
  importOrderParserPlugins: ["exportDefaultFrom", "typescript", "jsx"],
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  semi: false,
  trailingComma: "none"
}
