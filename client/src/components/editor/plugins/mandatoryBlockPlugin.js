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
      const mandatoryBlock = currentContentBlockData.mandatory
      const cursorOffset = selectionState.anchorOffset
      const blockLength = currentContentBlockText.length
      if (command === "backspace" && mandatoryBlock && cursorOffset === 0) {
        // Prevent backspace when at the beginning of the block, to avoid
        // merge with the previous block
        // FIXME: handleKeyCommand is not being used in this case for the first
        // content block, and when
        return "handled"
      }
      if (
        command === "delete" &&
        mandatoryBlock &&
        cursorOffset === blockLength
      ) {
        // Prevent delete when at the end of the block, to avoid
        // merge with the next block
        return "handled"
      }
      if (
        mandatoryBlock &&
        blockLength === 1 &&
        ((command === "delete" && cursorOffset === 0) ||
          (command === "backspace" && cursorOffset === 1))
      ) {
        // When a placeholder is given, instead of deleting last character,
        // replace it with the placeholder
        const nextState = editorState
        setEditorState(replaceWithPlaceholder(nextState, "placeholder", 0, 1))
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
