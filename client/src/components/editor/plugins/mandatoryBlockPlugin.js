/* eslint-disable */
import { EditorState, Modifier, SelectionState } from "draft-js"

const replaceWithPlaceholder = (
  editorState,
  startOffset,
  endOffset,
  placeholder
) => {
  // Replace the text with a placeholder
  const nextContentState = Modifier.replaceText(
    editorState.getCurrentContent(),
    editorState
      .getSelection()
      .set("isBackward", false)
      .set("anchorOffset", startOffset)
      .set("focusOffset", endOffset),
    placeholder
  )
  return EditorState.push(editorState, nextContentState, "replace-text")
}

const isMandatoryBlock = block => block?.data?.toObject()?.mandatory || false

const blockIsSelected = (block, editorState) => {
  const selectionState = editorState.getSelection()
  return (
    selectionState.anchorKey === selectionState.focusKey &&
    block.getLength() ===
      selectionState.getEndOffset() - selectionState.getStartOffset()
  )
}

const selectionHasMandatoryBlock = (selectionState, contentState) => {
  const selectionStartKey = selectionState.getStartKey()
  const selectionEndKey = selectionState.getEndKey()
  const blockAfterSelection = contentState.getBlockAfter(selectionEndKey) || {}
  let currentBlock = contentState.getBlockForKey(selectionStartKey)
  let selectionHasMandatoryBlock = false
  while (
    currentBlock &&
    currentBlock.key !== blockAfterSelection?.key &&
    !selectionHasMandatoryBlock
  ) {
    if (isMandatoryBlock(currentBlock)) {
      selectionHasMandatoryBlock = true
    }
    currentBlock = contentState.getBlockAfter(currentBlock.key)
  }
  return selectionHasMandatoryBlock
}

const getSelectionDetails = editorState => {
  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()
  return {
    ...selectionState.toObject(),
    isCollapsedSelection: selectionState.isCollapsed(), // anchor(Key/Offset) === focus(Key/Offset)
    isMultipleBlocksSelection:
      selectionState.anchorKey !== selectionState.focusKey,
    hasMandatoryBlock: selectionHasMandatoryBlock(selectionState, contentState),
    startOffset: selectionState.getStartOffset(),
    endOffset: selectionState.getEndOffset(),
  }
}

const createMandatoryBlockPlugin = config => {
  const blockStyleFn = contentBlock => {
    const contentBlockData = contentBlock.getData().toObject()
    if (contentBlockData.mandatory) {
      // Add mandatory class for content blocks marked as mandatory
      return "mandatory"
    }
  }

  const handleReturn = (e, editorState) => {
    const {
      anchorKey,
      hasMandatoryBlock,
      isCollapsedSelection,
      isMultipleBlocksSelection,
      startOffset,
    } = getSelectionDetails(editorState)

    const contentState = editorState.getCurrentContent()
    const currentBlock = contentState.getBlockForKey(anchorKey)
    const currentMandatory = isMandatoryBlock(currentBlock)
    if (currentMandatory && isCollapsedSelection && startOffset === 0) {
      // Prevent return at the beginning of a mandatory block, it would result
      // in an empty mandatory block and a new non-mandatory block containing
      // the text of the block which used to be mandatory.
      return "handled"
    }
    if (isMultipleBlocksSelection && hasMandatoryBlock) {
      // Prevent return when the selection contains at least one mandatory block,
      // it would result in deleting the selection including the mandatory block.
      return "handled"
    }
    if (
      currentMandatory &&
      !isMultipleBlocksSelection &&
      blockIsSelected(currentBlock, editorState)
    ) {
      // Prevent return when exactly one whole mandatory block is selected, it
      // would result in the contents of the mandatory block being deleted and
      // the addition of a new empty block afterwards.
      return "handled"
    }
  }

  const handleKeyCommand = (command, editorState, { setEditorState }) => {
    if (["backspace", "delete"].includes(command)) {
      // Backspace or delete have as effect deleting or merging blocks.
      // We don't want to merge a mandatory block B into a previous block A as:
      // - if block A is not mandatory, block B would lose it's style and data
      //   (thus also the mandatory property)
      // - if block A is also mandatory, we would end up with only one mandatory
      //    block instead of two.
      const {
        anchorKey,
        hasMandatoryBlock,
        isCollapsedSelection,
        isMultipleBlocksSelection,
        startOffset,
        endOffset,
      } = getSelectionDetails(editorState)

      const selectionState = editorState.getSelection()
      const contentState = editorState.getCurrentContent()
      const currentBlock = contentState.getBlockForKey(anchorKey)
      const { mandatory: currentMandatory, placeholder } =
        currentBlock?.data?.toObject() || {}
      const currentBlockLength = currentBlock.getLength()

      const previousBlock = contentState.getBlockBefore(
        selectionState.getStartKey()
      )
      const nextBlock = contentState.getBlockAfter(selectionState.getEndKey())
      const nextIsMandatory = isMandatoryBlock(nextBlock)

      if (isMultipleBlocksSelection && hasMandatoryBlock) {
        // Prevent deleting a selection of several blocks if at least one
        // of them is mandatory, we don't want to lose mandatory blocks.
        return "handled"
      }
      if (
        command === "backspace" &&
        currentMandatory &&
        isCollapsedSelection &&
        startOffset === 0
      ) {
        // Prevent backspace when at the beginning of a mandatory block,
        // we don't want to merge a mandatory block into a previous one.
        // Note: for the first content block, a backspace in this context
        // doesn't use handleKeyCommand, but that's not a problem, it becomes an
        // unstyled mandatory element
        return "handled"
      }

      if (
        command === "delete" &&
        nextIsMandatory &&
        !currentMandatory &&
        !currentBlockLength &&
        isCollapsedSelection &&
        startOffset === currentBlockLength
      ) {
        // When the current block is empty and the next one is mandatory,
        // a delete of the current block would result in the next block being
        // merged into the current block, we don't want to merge a mandatory
        // block into a previous one.
        // But we do want to be able to delete empty non mandatory blocks. By
        // doing a backwards delete instead, we make sure the empty block is
        // merged into the previous block and this leaves the next mandatory
        // block intact.
        // NOTE: Would be nicer to use RichUtils.handleKeyCommand(editorState, 'backspace')
        // but it returns undefined (see https://github.com/facebook/draft-js/issues/1849)
        const blockSelection = new SelectionState({
          anchorOffset: previousBlock.end,
          anchorKey: previousBlock.key,
          focusOffset: currentBlock.start,
          focusKey: currentBlock.key,
          isBackward: false,
          hasFocus: true,
        })
        const nextContentState = Modifier.removeRange(
          contentState,
          blockSelection,
          "backward"
        )
        setEditorState(
          EditorState.push(editorState, nextContentState, "delete-empty-block")
        )
        return "handled"
      }
      if (
        command === "delete" &&
        nextIsMandatory &&
        isCollapsedSelection &&
        startOffset === currentBlockLength
      ) {
        // Prevent delete when at the end of a block when the next block is
        // mandatory, we don't want to merge a mandatory block into a previous
        // one.
        return "handled"
      }
      if (
        placeholder &&
        currentMandatory &&
        ((currentBlockLength === 1 &&
          isCollapsedSelection &&
          ((command === "delete" && startOffset === 0) ||
            (command === "backspace" && endOffset === 1))) ||
          currentBlockLength === endOffset - startOffset)
      ) {
        // When a placeholder is given, instead of deleting the last character
        // or the whole text content of the block, replace it with placeholder.
        const nextState = editorState
        setEditorState(
          replaceWithPlaceholder(nextState, 0, currentBlockLength, placeholder)
        )
        return "handled"
      }
    }
    return "not-handled"
  }

  const handlePastedText = (text, html, editorState, { setEditorState }) => {
    const {
      isMultipleBlocksSelection,
      hasMandatoryBlock,
    } = getSelectionDetails(editorState)
    if (hasMandatoryBlock) {
      // Prevent pasting on a selection if at least one of the selection blocks
      // is mandatory. It would result in the removal of mandatory blocks.
      return "handled"
    }
    return "not-handled"
  }

  return {
    blockStyleFn: blockStyleFn,
    handleReturn: handleReturn,
    handleKeyCommand: handleKeyCommand,
    handlePastedText: handlePastedText,
  }
}

export default createMandatoryBlockPlugin
