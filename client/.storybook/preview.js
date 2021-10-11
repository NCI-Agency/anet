import { addDecorator } from "@storybook/react"
import "bootstrap/dist/css/bootstrap.css"
import "index.css"
import React from "react"
import { MemoryRouter } from "react-router"

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

addDecorator(story => (
  <MemoryRouter initialEntries={["/"]}>{story()}</MemoryRouter>
))
