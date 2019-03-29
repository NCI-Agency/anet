import { action } from "@storybook/addon-actions"
import { storiesOf } from "@storybook/react"
import React from "react"
import RichTextEditor from "../src/components/RichTextEditor"

storiesOf("Rich Text Editor", module).add("default", () => (
  <RichTextEditor onChange={action("editor-click")} />
))
