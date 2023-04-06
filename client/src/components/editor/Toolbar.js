import { Icon } from "@blueprintjs/core"
import { Tooltip2 } from "@blueprintjs/popover2"
import PropTypes from "prop-types"
import React, { useRef } from "react"
import { Editor, Transforms } from "slate"
import { useSlate } from "slate-react"
import { ANET_LINK, EXTERNAL_LINK } from "utils_links"
import LinkSourceAnet from "./LinkSourceAnet"
import "./RichTextEditor.css"

const LIST_TYPES = ["bulleted-list", "numbered-list"]
const BUTTON_TYPES = {
  MARK: "mark",
  BLOCK: "block",
  MODAL: "modal",
  FULLSCREEN: "fullscreen"
}

const Toolbar = ({
  showAnetLinksModal,
  setShowAnetLinksModal,
  showExternalLinksModal,
  setShowExternalLinksModal,
  showInFullScreen,
  setFullScreenHandle,
  disableFullSize
}) => {
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
          tooltipText="Bold (Ctrl + b)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MARK}
          editor={editor}
          format="italic"
          icon="italic"
          tooltipText="Italic (Ctrl + i)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MARK}
          editor={editor}
          format="underline"
          icon="underline"
          tooltipText="Underline (Ctrl + u)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MARK}
          editor={editor}
          format="strikethrough"
          icon="strikethrough"
          tooltipText="Strikethrough (Ctrl + ⇧ + x)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="block-quote"
          icon="citation"
          tooltipText="Block quote (Alt + q)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="heading-one"
          icon="header-one"
          tooltipText="Heading one (Alt + 1)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="heading-two"
          icon="header-two"
          tooltipText="Heading two (Alt + 2)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="heading-three"
          icon="header-three"
          tooltipText="Heading three (Alt + 3)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="bulleted-list"
          icon="properties"
          tooltipText="Bulleted list (Alt + b)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.BLOCK}
          editor={editor}
          format="numbered-list"
          icon="numbered-list"
          tooltipText="Numbered list (Alt + n)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MODAL}
          editor={editor}
          format={ANET_LINK}
          icon="link"
          text="ANET Link"
          showModal={showAnetLinksModal}
          setShowModal={setShowAnetLinksModal}
          selectionRef={selectionRef}
          tooltipText="ANET link (Ctrl + ⇧ + k)"
        />
        <EditorToggleButton
          type={BUTTON_TYPES.MODAL}
          editor={editor}
          format={EXTERNAL_LINK}
          icon="link"
          showModal={showExternalLinksModal}
          setShowModal={setShowExternalLinksModal}
          selectionRef={selectionRef}
          tooltipText="External link (Ctrl + ⇧ + a)"
        />
        <EditorToggleButton
          icon="undo"
          onClick={editor.undo}
          tooltipText="Undo (Ctrl + z)"
        />
        <EditorToggleButton
          icon="redo"
          onClick={editor.redo}
          tooltipText="Redo (Ctrl + y or Ctrl + ⇧ + z)"
        />
        {!disableFullSize
          ? <EditorToggleButton
              type={BUTTON_TYPES.FULLSCREEN}
              icon= {showInFullScreen ? "minimize" : "fullscreen"}
              editor={editor}
              showFullScreen={showInFullScreen}
              setFullScreenHandle={setFullScreenHandle}
              tooltipText={showInFullScreen ? "Minimize (Escape)" : "Full Size (Alt + Enter)"}
            /> : ""}
      </div>
      <LinkSourceAnet
        editor={editor}
        showModal={showAnetLinksModal}
        setShowModal={setShowAnetLinksModal}
        selection={selectionRef.current}
      />
      <LinkSourceAnet
        editor={editor}
        showModal={showExternalLinksModal}
        setShowModal={setShowExternalLinksModal}
        selection={selectionRef.current}
        external
      />
    </>
  )
}

Toolbar.propTypes = {
  showAnetLinksModal: PropTypes.bool.isRequired,
  setShowAnetLinksModal: PropTypes.func.isRequired,
  showExternalLinksModal: PropTypes.bool.isRequired,
  setShowExternalLinksModal: PropTypes.func.isRequired,
  showInFullScreen: PropTypes.bool.isRequired,
  setFullScreenHandle: PropTypes.func.isRequired,
  disableFullSize: PropTypes.bool.isRequired
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
  tooltipText,
  showModal,
  setShowModal,
  selectionRef,
  onClick,
  showFullScreen,
  setFullScreenHandle
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
    case BUTTON_TYPES.FULLSCREEN:
      onMouseDown = () => {
        setFullScreenHandle(!showFullScreen)
      }
      break
    default:
      onMouseDown = onClick
  }

  return (
    <Tooltip2
      content={tooltipText}
      position="top"
      hoverOpenDelay={1000}
      className="editor-toggle-button-container"
    >
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
    </Tooltip2>
  )
}

EditorToggleButton.propTypes = {
  type: PropTypes.string,
  editor: PropTypes.object,
  format: PropTypes.string,
  icon: PropTypes.string,
  text: PropTypes.string,
  tooltipText: PropTypes.string,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func,
  selectionRef: PropTypes.object,
  onClick: PropTypes.func,
  showFullScreen: PropTypes.bool,
  setFullScreenHandle: PropTypes.func
}

export const handleOnKeyDown = (
  event,
  editor,
  setShowAnetLinksModal,
  setShowExternalLinksModal
) => {
  // Ignore the state of CapsLock
  const key = event.shiftKey ? event.key.toUpperCase() : event.key.toLowerCase()
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
        setShowAnetLinksModal(true)
        break
      case "A":
        event.preventDefault()
        setShowExternalLinksModal(true)
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
