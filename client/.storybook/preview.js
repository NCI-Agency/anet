import "bootstrap/dist/css/bootstrap.css"
import "index.css"
import React from "react"
import { MemoryRouter } from "react-router"

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  options: {
    // Sort stories alphabetically
    storySort: (a, b) =>
      a.title === b.title
        ? 0
        : a.id.localeCompare(b.id, undefined, { numeric: true })
  }
}

export const decorators = [
  story => <MemoryRouter initialEntries={["/"]}>{story()}</MemoryRouter>
]
