import escapeHtml from "escape-html"
import PropTypes from "prop-types"
import React, { useCallback, useMemo, useState } from "react"
import { createEditor, Text } from "slate"
import { withHistory } from "slate-history"
import { Editable, Slate, withReact } from "slate-react"
import Toolbar from "./Toolbar"

const SlateEditor = ({ value, onChange }) => {
  const editor = useMemo(() => withReact(withHistory(createEditor())), [])
  const document = new DOMParser().parseFromString(value, "text/html")
  const [value, setValue] = useState(initialValueSlate)
  const deserialized = deserialize(document.body)
  const [slateValue, setSlateValue] = useState(deserialized)

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  return (
    <Slate
      editor={editor}
      value={slateValue}
      onChange={newValue => {
        setSlateValue(newValue)
        onChange(serialize(editor))
      }}
    >
      <Toolbar />
      <Editable renderElement={renderElement} renderLeaf={renderLeaf} />
    </Slate>
  )
}

SlateEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
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
    if (node.code) {
      string = `<code>${string}</code>`
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
    case "paragraph":
      return `<p>${children}</p>`
    case "block-quote":
      return `<blockquote>${children}</blockquote>`
    case "bulleted-list":
      return `<ul>${children}</ul>`
    case "heading-one":
      return `<h1>${children}</h1>`
    case "heading-two":
      return `<h2>${children}</h2>`
    case "heading-three":
      return `<h3>${children}</h3>`
    case "list-item":
      return `<li>${children}</li>`
    case "numbered-list":
      return `<ol>${children}</ol>`
    default:
      return children
  }
}

const deserialize = element => {
  const children = Array.from(element.childNodes).map(deserialize)
  switch (element.nodeName) {
    case "BODY":
      return jsx("fragment", {}, children)
    case "P":
      return jsx("element", { type: "paragraph" }, children)
    case "STRONG":
      return jsx("text", { bold: true }, children)
    case "EM":
      return jsx("text", { italic: true }, children)
    case "U":
      return jsx("text", { underline: true }, children)
    case "STRIKE":
      return jsx("text", { strikethrough: true }, children)
    case "H1":
      return jsx("element", { type: "heading-one" }, children)
    case "H2":
      return jsx("element", { type: "heading-two" }, children)
    case "H3":
      return jsx("element", { type: "heading-three" }, children)
    case "BLOCKQUOTE":
      return jsx("element", { type: "block-quote" }, children)
    case "LI":
      return jsx("element", { type: "list-item" }, children)
    case "UL":
      return jsx("element", { type: "bulleted-list" }, children)
    case "OL":
      return jsx("element", { type: "numbered-list" }, children)
    default:
      return element.textContent
  }
}

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>
    case "heading-three":
      return <h3 {...attributes}>{children}</h3>
    case "list-item":
      return <li {...attributes}>{children}</li>
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>
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

  if (leaf.code) {
    children = <code>{children}</code>
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

  if (leaf.highlight) {
    children = <span style={{ backgroundColor: "yellow" }}>{children}</span>
  }

  return <span {...attributes}>{children}</span>
}

Leaf.propTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node,
  leaf: PropTypes.object
}

const initialValueSlate = [
  {
    type: "paragraph",
    children: [
      { text: "This is editable " },
      { text: "rich", bold: true },
      { text: " text, " },
      { text: "much", italic: true },
      { text: " better than a " },
      { text: "<textarea>", code: true },
      { text: "!" }
    ]
  },
  {
    type: "paragraph",
    children: [
      {
        text:
          "Since it's rich text, you can do things like turn a selection of text "
      },
      { text: "bold", bold: true },
      {
        text:
          ", or add a semantically rendered block quote in the middle of the page, like this:"
      }
    ]
  },
  {
    type: "block-quote",
    children: [{ text: "A wise quote." }]
  },
  {
    type: "paragraph",
    children: [{ text: "Try it out for yourself!" }]
  }
]

export default SlateEditor
