import { Editor } from "slate"

export function getSelectedParentNode(editor) {
  if (!editor.selection) {
    return null
  }
  const path = Editor.path(editor, editor.selection)
  if (!path?.length) {
    return null
  }
  return Editor.parent(editor, editor.selection)
}
