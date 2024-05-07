module.exports = {
  arrowParens: "avoid",
  importOrder: ["@fullcalendar/react", "^[^.]", "^[./]"],
  importOrderCaseInsensitive: true,
  importOrderParserPlugins: ["exportDefaultFrom", "typescript", "jsx"],
  importOrderSortSpecifiers: true,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  semi: false,
  trailingComma: "none"
}
