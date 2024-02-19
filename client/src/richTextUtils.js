import { Editor } from "slate"

export function getSelectedParentNode(editor) {
  const path = Editor.path(editor, editor.selection)
  return (
    path?.length && editor.selection && Editor.parent(editor, editor.selection)
  )
}
