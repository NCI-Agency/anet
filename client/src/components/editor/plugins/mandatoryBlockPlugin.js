import { EditorState, Modifier } from "draft-js"

const replaceWithPlaceholder = (
  nextState,
  placeholder,
  startOffset,
  endOffset
) => {
  // Replace the text with a placeholder
  const nextContentState = Modifier.replaceText(
    nextState.getCurrentContent(),
    nextState
      .getSelection()
      .set("isBackward", false)
      .set("anchorOffset", startOffset)
      .set("focusOffset", endOffset),
    placeholder
  )
  return EditorState.push(nextState, nextContentState, "replace-text")
}

const createMandatoryBlockPlugin = config => {
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
      const { mandatory, placeholder } = currentContentBlockData
      const { anchorOffset, focusOffset } = selectionState
      const startOffset = selectionState.getStartOffset()
      const endOffset = selectionState.getEndOffset()
      const blockLength = currentContentBlockText.length
      if (
        command === "backspace" &&
        mandatory &&
        anchorOffset === focusOffset &&
        anchorOffset === 0
      ) {
        // Prevent backspace when at the beginning of the block, to avoid
        // merge with the previous block
        // Note: for the first content block, a backspace in this context
        // doesn't use handleKeyCommand, but that's not a problem, it becomes an
        // unstyled mandatory element
        return "handled"
      }
      if (
        command === "delete" &&
        mandatory &&
        anchorOffset === focusOffset &&
        anchorOffset === blockLength
      ) {
        // Prevent delete when at the end of the block, to avoid
        // merge with the next block
        return "handled"
      }
      if (
        placeholder &&
        mandatory &&
        ((blockLength === 1 && command === "delete" && anchorOffset === 0) ||
          (blockLength === 1 &&
            command === "backspace" &&
            anchorOffset === 1) ||
          (blockLength === endOffset - startOffset &&
            ["backspace", "delete"].includes(command)))
      ) {
        // When a placeholder is given, instead of deleting last left character or
        // instead of deleting the whole text content, replace it with placeholder
        const nextState = editorState
        setEditorState(
          replaceWithPlaceholder(nextState, placeholder, 0, blockLength)
        )
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

export default createMandatoryBlockPlugin
