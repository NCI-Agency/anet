import { EditorState, Modifier } from "draft-js"

const createPlaceholder = (placeholder, nextState) => {
  // Replace the text with a placeholder
  const nextContentState = Modifier.replaceText(
    nextState.getCurrentContent(),
    nextState.getSelection(),
    placeholder
  )
  return EditorState.push(nextState, nextContentState, "insert-characters")
}

const createReadonlyBlockPlugin = config => {
  // TODO: rename plugin
  const blockStyleFn = contentBlock => {
    const contentBlockData = contentBlock.getData().toObject()
    if (contentBlockData.mandatory) {
      // Add mandatory class for content blocks marked as mandatory
      return "mandatory"
    }
  }

  const handleKeyCommand = (command, editorState, { setEditorState }) => {
    if (["backspace", "delete"].includes(command)) {
      const selectionState = editorState.getSelection()
      const anchorKey = selectionState.getAnchorKey()
      const contentState = editorState.getCurrentContent()
      const currentContentBlock = contentState.getBlockForKey(anchorKey)
      const currentContentBlockData = currentContentBlock.getData().toObject()
      const currentContentBlockText = currentContentBlock.getText()
      const mandatoryBlock = currentContentBlockData.mandatory
      const blockAchorOffset = selectionState.anchorOffset
      const blockLength = currentContentBlockText.length
      if (command === "backspace" && mandatoryBlock && blockAchorOffset === 0) {
        // Prevent deleting the block itself
        // FIXME: handleKeyCommand is not being used in this case for the first
        // content block
        return "handled"
      }
      if (
        command === "delete" &&
        mandatoryBlock &&
        blockAchorOffset === blockLength
      ) {
        // Prevent deleting the block itself
        return "handled"
      }
      if (
        command === "delete" &&
        mandatoryBlock &&
        blockAchorOffset === 0 &&
        blockLength === 1
      ) {
        // Replace by placeholder
        const nextState = editorState
        setEditorState(createPlaceholder("placeholder", nextState))
        return "handled"
      }
      if (
        command === "backspace" &&
        mandatoryBlock &&
        blockAchorOffset === 1 &&
        blockLength === 1
      ) {
        // Replace by placeholder
        const nextState = editorState
        setEditorState(createPlaceholder("placeholder", nextState))
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
