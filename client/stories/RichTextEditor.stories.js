import { action } from "@storybook/addon-actions"
import React from "react"
import RichTextEditor from "../src/components/RichTextEditor"

export default {
  title: 'ANET/RichTextEditor',
  component: RichTextEditor
}

const Template = (args) => <RichTextEditor {...args} />

export const EditorOnChange = Template.bind({})
EditorOnChange.args = {
  onChange: action("editor-click")
}
