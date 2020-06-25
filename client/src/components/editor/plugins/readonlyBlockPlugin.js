const createReadonlyBlockPlugin = config => {
  // TODO: rename plugin
  const blockStyleFn = contentBlock => {
    const contentBlockData = contentBlock.getData().toObject()
    if (contentBlockData.mandatory) {
      // Add mandatory class for content blocks marked as mandatory
      return "mandatory"
    }
  }

  const handleKeyCommand = (command, editorState) => {
    if (["backspace", "delete"].includes(command)) {
      const selectionState = editorState.getSelection()
      const anchorKey = selectionState.getAnchorKey()
      const contentState = editorState.getCurrentContent()
      const currentContentBlock = contentState.getBlockForKey(anchorKey)
      const currentContentBlockData = currentContentBlock.getData().toObject()
      const currentContentBlockText = currentContentBlock.getText()
      if (
        currentContentBlockData.mandatory &&
        currentContentBlockText.length === 1
      ) {
        // Prevent deleting the block itself
        return "handled"
      }
    }

    return "not-handled"
  }
  return {
    blockStyleFn: blockStyleFn,
    handleKeyCommand: handleKeyCommand
  }
}

export default createReadonlyBlockPlugin
