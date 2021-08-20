import PropTypes from "prop-types"
import React from "react"
import { Editor, Transforms } from "slate"
import { useSlate } from "slate-react"

const LIST_TYPES = ["bulleted-list", "numbered-list"]

const Toolbar = () => {
  const editor = useSlate()
  return (
    <div>
      <MarkButton editor={editor} format="bold" text="Bold" />
      <MarkButton editor={editor} format="italic" text="Italic" />
      <MarkButton editor={editor} format="underline" text="Underline" />
      <MarkButton editor={editor} format="strikethrough" text="Strikethrough" />
      <BlockButton editor={editor} format="block-quote" text="Blockquote" />
      <BlockButton editor={editor} format="heading-one" text="H1" />
      <BlockButton editor={editor} format="heading-two" text="H2" />
      <BlockButton editor={editor} format="heading-three" text="H3" />
      <BlockButton editor={editor} format="bulleted-list" text="UL" />
      <BlockButton editor={editor} format="numbered-list" text="OL" />
    </div>
  )
}

function toggleBlock(editor, format) {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n => LIST_TYPES.includes(n.type),
    split: true
  })

  Transforms.setNodes(editor, {
    type: isActive ? "paragraph" : isList ? "list-item" : format
  })

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

function isBlockActive(editor, format) {
  const [match] = Editor.nodes(editor, {
    match: n => n.type === format
  })

  return !!match
}

function toggleMark(editor, format) {
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

function isMarkActive(editor, format) {
  const marks = Editor.marks(editor)
  return marks && marks[format] === true
}

const BlockButton = ({ editor, format, text }) => {
  return (
    <button
      type="button"
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      {text}
    </button>
  )
}

BlockButton.propTypes = {
  editor: PropTypes.object.isRequired,
  format: PropTypes.string.isRequired,
  text: PropTypes.string
}

const MarkButton = ({ editor, format, text }) => {
  return (
    <button
      type="button"
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      {text}
    </button>
  )
}

MarkButton.propTypes = {
  editor: PropTypes.object.isRequired,
  format: PropTypes.string.isRequired,
  text: PropTypes.string
}

export default Toolbar
