import LinkAnet from "components/editor/LinkAnet"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import "components/editor/RichTextEditor.css"
import Toolbar, { handleOnKeyDown } from "components/editor/Toolbar"
import escapeHtml from "escape-html"
import { debounce } from "lodash"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import moment from "moment/moment"
import PropTypes from "prop-types"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createEditor, Text, Transforms } from "slate"
import { withHistory } from "slate-history"
import { jsx } from "slate-hyperscript"
import {
  Editable,
  Slate,
  useFocused,
  useSelected,
  withReact
} from "slate-react"
import { getUrlFromEntityInfo } from "utils_links"

const createSlateValue = value => {
  const document = new DOMParser().parseFromString(value || "", "text/html")
  return deserialize(document.body)
}

const usePrevious = value => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

const RichTextEditor = ({
  value,
  onChange,
  onHandleBlur,
  className,
  readOnly
}) => {
  const [showLinksModal, setShowLinksModal] = useState(false)
  const editor = useMemo(
    () => withHtml(withReact(withHistory(withAnetLink(createEditor())))),
    []
  )

  const [slateValue, setSlateValue] = useState(createSlateValue(value))
  const previousValue = usePrevious(value)

  useEffect(() => {
    if (readOnly && previousValue !== undefined && previousValue !== value) {
      // Only update editor when a new value comes in
      // (different from the one used for slateValue above)
      editor.children = createSlateValue(value)
      editor.onChange()
    }
  }, [editor, previousValue, readOnly, value])

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  return (
    <div className={className}>
      <Slate
        editor={editor}
        value={slateValue}
        onChange={newValue => {
          setSlateValue(newValue)
          serializeDebounced(editor, onChange)
        }}
      >
        <div className={!readOnly ? "editor-container" : null}>
          {!readOnly && (
            <Toolbar
              showLinksModal={showLinksModal}
              setShowLinksModal={setShowLinksModal}
            />
          )}
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onBlur={onHandleBlur}
            onKeyDown={e => handleOnKeyDown(e, editor, setShowLinksModal)}
            className="editable"
            readOnly={readOnly}
          />
        </div>
      </Slate>
    </div>
  )
}

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onHandleBlur: PropTypes.func,
  className: PropTypes.string,
  readOnly: PropTypes.bool
}

const withHtml = editor => {
  const { insertData } = editor
  editor.insertData = data => {
    const html = data?.getData("text/html")
    if (html) {
      // Strip whitespace surrounding newlines between > and <
      // This avoids creating empty paragraphs!
      const htmlNoNewlines = html.replace(/>\s*(\r\n|\n|\r)\s*</gm, "><")
      const parsed = new DOMParser().parseFromString(
        htmlNoNewlines,
        "text/html"
      )
      const nodes = deserialize(parsed.body)
      Transforms.insertNodes(editor, nodes)
    } else {
      insertData(data)
    }
  }
  return editor
}

const withAnetLink = editor => {
  const { isVoid, isInline } = editor
  editor.isVoid = element =>
    element.type === "anet-link" ? true : isVoid(element)
  editor.isInline = element =>
    element.type === "anet-link" ? true : isInline(element)
  return editor
}

const serialize = node => {
  if (Text.isText(node)) {
    let string = escapeHtml(node.text)
    if (node.bold) {
      string = `<strong>${string}</strong>`
    }
    if (node.italic) {
      string = `<em>${string}</em>`
    }
    if (node.underline) {
      string = `<u>${string}</u>`
    }
    if (node.strikethrough) {
      string = `<strike>${string}</strike>`
    }
    return string
  }
  const children = node.children.map(n => serialize(n)).join("")
  switch (node.type) {
    case "heading-one":
      return `<h1>${children}</h1>`
    case "heading-two":
      return `<h2>${children}</h2>`
    case "heading-three":
      return `<h3>${children}</h3>`
    case "paragraph":
      return `<p>${children}</p>`
    case "numbered-list":
      return `<ol>${children}</ol>`
    case "bulleted-list":
      return `<ul>${children}</ul>`
    case "list-item":
      return `<li>${children}</li>`
    case "block-quote":
      return `<blockquote>${children}</blockquote>`
    case "anet-link":
      return `<a href="${getUrlFromEntityInfo(node)}">${node.children.text}</a>`
    default:
      return children
  }
}

const serializeDebounced = debounce((node, onChange) => {
  const serialized = serialize(node)
  onChange?.(serialized)
  return serialized
}, 100)

const deserialize = element => {
  let children = Array.from(element.childNodes).map(deserialize)
  // Body must have at least one children node for user to be able to edit the text in it
  // Every other node must have a non-empty array of children
  if (element.nodeName !== "#text" && _isEmpty(children)) {
    children =
      element.nodeName === "BODY"
        ? jsx("element", { type: "paragraph" }, [{ text: "" }])
        : [{ text: "" }]
  }

  switch (element.nodeName) {
    case "BODY":
      return jsx("fragment", {}, children)
    case "H1":
      return jsx("element", { type: "heading-one" }, children)
    case "H2":
      return jsx("element", { type: "heading-two" }, children)
    case "H3":
      return jsx("element", { type: "heading-three" }, children)
    case "P":
      return element.parentNode.nodeName === "LI"
        ? jsx("fragment", {}, children)
        : jsx("element", { type: "paragraph" }, children)
    case "OL":
      return jsx("element", { type: "numbered-list" }, children)
    case "UL":
      return jsx("element", { type: "bulleted-list" }, children)
    case "LI":
      return jsx("element", { type: "list-item" }, children)
    case "BLOCKQUOTE":
    case "CITE":
      return jsx("element", { type: "block-quote" }, children)
    case "A":
      return jsx(
        "element",
        { type: "anet-link", href: element.getAttribute("href") },
        children
      )
    case "STRONG":
    case "B":
      return jsx("text", { bold: true }, children)
    case "EM":
    case "I":
      return jsx("text", { italic: true }, children)
    case "U":
      return jsx("text", { underline: true }, children)
    case "STRIKE":
      return jsx("text", { strikethrough: true }, children)
    default:
      // Text cannot be the direct child of BODY.
      // If the value is plain text without any html tags, it should be wrapped in a "<p></p>" tag
      return element.parentNode.nodeName === "BODY"
        ? jsx("element", { type: "paragraph" }, element.textContent)
        : element.textContent
  }
}

const displayCallback = modelInstance => {
  if (modelInstance instanceof Models.Report) {
    return modelInstance.engagementDate
      ? moment(modelInstance.engagementDate).format(
        Models.Report.getEngagementDateFormat()
      )
      : "None"
  } else {
    return modelInstance.toString()
  }
}

const Element = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()
  switch (element.type) {
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>
    case "heading-three":
      return <h3 {...attributes}>{children}</h3>
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>
    case "list-item":
      return <li {...attributes}>{children}</li>
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>
    case "anet-link":
      return (
        <span
          {...attributes}
          style={{
            padding: "1px",
            verticalAlign: "baseline",
            display: "inline-block",
            borderRadius: "4px",
            boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none"
          }}
        >
          {element.href ? (
            <LinkAnet url={element.href} displayCallback={displayCallback} />
          ) : (
            <LinkAnetEntity
              type={element.entityType}
              uuid={element.entityUuid}
              displayCallback={displayCallback}
            />
          )}
          {children}
        </span>
      )
    default:
      return <p {...attributes}>{children}</p>
  }
}

Element.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node,
  element: PropTypes.object
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  if (leaf.underline) {
    children = <u>{children}</u>
  }
  if (leaf.strikethrough) {
    children = <strike>{children}</strike>
  }
  return <span {...attributes}>{children}</span>
}

Leaf.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node,
  leaf: PropTypes.object
}

export default RichTextEditor
