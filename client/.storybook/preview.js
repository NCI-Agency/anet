import "bootstrap/dist/css/bootstrap.css"
import "index.css"

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    // Sort stories alphabetically
    storySort: (a, b) =>
      a[1].kind === b[1].kind
        ? 0
        : a[1].id.localeCompare(b[1].id, undefined, { numeric: true })
  }
}
