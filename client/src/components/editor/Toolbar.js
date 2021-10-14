import { Icon } from "@blueprintjs/core"
import PropTypes from "prop-types"
import React, { useRef } from "react"
import { Editor, Transforms } from "slate"
import { useSlate } from "slate-react"
import LinkSourceAnet from "./LinkSourceAnet"
import "./RichTextEditor.css"

const LIST_TYPES = ["bulleted-list", "numbered-list"]
const BUTTON_TYPES = {
  MARK: "mark",
  BLOCK: "block",
  MODAL: "modal"
}

const Toolbar = ({ showLinksModal, setShowLinksModal }) => {
  const editor = useSlate()
  const selectionRef = useRef(editor.selection)

  return (
    <>
      <div className="toolbar">
        <EditorToggleButton
          type={BUTTON_TYPES.MARK}
          editor={editor}
          format="bold"
          icon="bold"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MARK}
          editor={editor}
          format="italic"
          icon="italic"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MARK}
          editor={editor}
          format="underline"
          icon="underline"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MARK}
          editor={editor}
          format="strikethrough"
          icon="strikethrough"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="block-quote"
          icon="citation"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="heading-one"
          icon="header-one"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="heading-two"
          icon="header-two"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="heading-three"
          icon="header-three"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="bulleted-list"
          icon="properties"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="numbered-list"
          icon="numbered-list"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MODAL}
          editor={editor}
          format="anet-link"
          icon="link"
          text="ANET Link"
          showModal={showLinksModal}
          setShowModal={setShowLinksModal}
          selectionRef={selectionRef}
        />
        <EditorToggleButton icon="undo" onClick={editor.undo} />
        <EditorToggleButton icon="redo" onClick={editor.redo} />
      </div>
      <LinkSourceAnet
        editor={editor}
        showModal={showLinksModal}
        setShowModal={setShowLinksModal}
        selection={selectionRef.current}
      />
    </>
  )
}

Toolbar.propTypes = {
  showLinksModal: PropTypes.bool.isRequired,
  setShowLinksModal: PropTypes.func.isRequired
}

function toggleBlock(editor, format, event) {
  event?.preventDefault?.()
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

function toggleMark(editor, format, event) {
  event?.preventDefault?.()
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

const EditorToggleButton = ({
  type,
  editor,
  format,
  icon,
  text,
  showModal,
  setShowModal,
  selectionRef,
  onClick
}) => {
  let isActive
  let onMouseDown
  switch (type) {
    case BUTTON_TYPES.MARK:
      isActive = isMarkActive(editor, format)
      onMouseDown = () => toggleMark(editor, format)
      break
    case BUTTON_TYPES.BLOCK:
      isActive = isBlockActive(editor, format)
      onMouseDown = () => toggleBlock(editor, format)
      break
    case BUTTON_TYPES.MODAL:
      isActive = showModal
      onMouseDown = () => {
        selectionRef.current = editor.selection
        setShowModal(true)
      }
      break
    default:
      onMouseDown = onClick
  }

  return (
    <button
      type="button"
      className={`editor-toggle-button ${isActive ? "active" : ""}`}
      tabIndex={-1}
      onMouseDown={event => {
        event.preventDefault()
        onMouseDown()
      }}
    >
      <Icon icon={icon} />
      {text}
    </button>
  )
}

EditorToggleButton.propTypes = {
  type: PropTypes.string,
  editor: PropTypes.object,
  format: PropTypes.string,
  icon: PropTypes.string,
  text: PropTypes.string,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  selectionRef: PropTypes.object,
  onClick: PropTypes.func
}

export const handleOnKeyDown = (event, editor, setShowLinksModal) => {
  const key = event.key
  if (event.altKey) {
    switch (key) {
      case "1":
        toggleBlock(editor, "heading-one", event)
        break
      case "2":
        toggleBlock(editor, "heading-two", event)
        break
      case "3":
        toggleBlock(editor, "heading-three", event)
        break
      case "n":
        toggleBlock(editor, "numbered-list", event)
        break
      case "b":
        toggleBlock(editor, "bulleted-list", event)
        break
      case "q":
        toggleBlock(editor, "block-quote", event)
        break
      default:
        break
    }
  }
  if (event.ctrlKey) {
    switch (key) {
      case "b":
        toggleMark(editor, "bold", event)
        break
      case "i":
        toggleMark(editor, "italic", event)
        break
      case "u":
        toggleMark(editor, "underline", event)
        break
      case "X":
        toggleMark(editor, "strikethrough", event)
        break
      case "K":
        event.preventDefault()
        setShowLinksModal(true)
        break
      case "y":
      case "Z":
        event.preventDefault()
        editor.redo()
        break
      case "z":
        event.preventDefault()
        editor.undo()
        break
      default:
        break
    }
  }
}

export default Toolbar
