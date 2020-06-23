export const preventHandleOnReadonly = editorState => {
  const selectionState = editorState.getSelection()
  const anchorKey = selectionState.getAnchorKey()
  const contentState = editorState.getCurrentContent()
  const currentContentBlock = contentState.getBlockForKey(anchorKey)
  const currentContentBlockData = currentContentBlock.getData().toObject()
  if (currentContentBlockData.mandatory) {
    return "handled"
  }
  return "not-handled"
}

const createReadonlyBlockPlugin = config => {
  const handleKeyCommand = (command, editorState) => {
    return preventHandleOnReadonly(editorState)
  }
  const handleBeforeInput = (chars, editorState) => {
    return preventHandleOnReadonly(editorState)
  }
  return {
    handleKeyCommand: handleKeyCommand,
    handleBeforeInput: handleBeforeInput
  }
}

export default createReadonlyBlockPlugin
