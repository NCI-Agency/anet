module.exports = {
  arrowParens: "avoid",
  importOrder: ["^constants/", "^@fullcalendar/react", "^[^.]", "^[./]"],
  importOrderCaseSensitive: false,
  importOrderParserPlugins: ["exportDefaultFrom", "typescript", "jsx"],
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  semi: false,
  trailingComma: "none"
}
