import React from "react"
import RichTextEditor from "../src/components/RichTextEditor"

export default {
  title: "ANET/RichTextEditor",
  component: RichTextEditor
}

const Template = args => <RichTextEditor {...args} />

export const EditorOnChange = Template.bind({})
EditorOnChange.args = {
  className: "textField",
  value: "editor content"
}
