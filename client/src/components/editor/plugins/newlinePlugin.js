import { ContentState, EditorState, Modifier, convertFromHTML } from "draft-js"

const HTML_REGEX = new RegExp(/<[a-z][\s\S]*>/i)
const NEW_LINE_REGEX = new RegExp(/^([^"\r\n]*(?:(?:"[^"]*")*[^"\r\n]*))/gm)

const createNewLines = (newLines, nextState) => {
  // Create simple htmlMarkup with paragraphs based on the new lines array
  const htmlMarkup = newLines.map(text => {
    return text.length <= 1 ? "" : `<p>${text}</p>`
  })

  // Create content blocks based on the html for the new content statue
  const blocksFromHTML = convertFromHTML(htmlMarkup.join(""))
  const newContentState = ContentState.createFromBlockArray(
    blocksFromHTML.contentBlocks,
    blocksFromHTML.entityMap
  )

  // Replace the fragment in the right place of the current content
  const nextContentState = Modifier.replaceWithFragment(
    nextState.getCurrentContent(),
    nextState.getSelection(),
    newContentState.getBlockMap()
  )
  return EditorState.push(nextState, nextContentState, "insert-fragment")
}

const newlinePlugin = () => ({
  handlePastedText(text, html, editorState, { setEditorState }) {
    const nextState = editorState
    if (!HTML_REGEX.test(html)) {
      const newLines = text.match(NEW_LINE_REGEX)
      setEditorState(newLines ? createNewLines(newLines, nextState) : nextState)
      return "handled"
    }
    /**
     * Do not handle new lines when html is provided
     */
    return "not-handled"
  }
})

export default newlinePlugin
