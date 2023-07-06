import RichTextEditor from "components/RichTextEditor"
import React from "react"

export default {
  title: "ANET Components/RichTextEditor",
  component: RichTextEditor
}

const Template = args => <RichTextEditor {...args} />

export const EditorOnChange = Template.bind({})
EditorOnChange.args = {
  className: "textField",
  value: "editor content"
}
