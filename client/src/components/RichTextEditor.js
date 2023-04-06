import classNames from "classnames"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import LinkExternalHref from "components/editor/LinkExternalHref"
import "components/editor/RichTextEditor.css"
import Toolbar, { handleOnKeyDown } from "components/editor/Toolbar"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import escapeHtml from "escape-html"
import { debounce } from "lodash"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import moment from "moment/moment"
import PropTypes from "prop-types"
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import scrollIntoView from "scroll-into-view-if-needed"
import { createEditor, Range, Text, Transforms } from "slate"
import { withHistory } from "slate-history"
import { jsx } from "slate-hyperscript"
import {
  Editable,
  Slate,
  useFocused,
  useSelected,
  withReact
} from "slate-react"
import {
  ANET_LINK,
  EXTERNAL_LINK,
  getEntityInfoFromUrl,
  getUrlFromEntityInfo,
  LINK_TYPES
} from "utils_links"

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

function smoothScrollIntoView(element) {
  scrollIntoView(element, {
    behavior: "smooth",
    scrollMode: "if-needed",
    block: "nearest",
    inline: "nearest"
  })
}

function scrollSelectionIntoView(editor, domRange) {
  // Use the same condition as Editable.defaultScrollSelectionIntoView for deciding when to scroll
  if (
    !editor.selection ||
    (editor.selection && Range.isCollapsed(editor.selection))
  ) {
    // Use a newer version of scrollIntoView than Slate, and only do a smooth scroll if needed
    smoothScrollIntoView(domRange.startContainer.parentElement)
  }
}

const RichTextEditor = ({
  value,
  onChange,
  onHandleBlur,
  className,
  readOnly,
  disableFullSize
}) => {
  const [showAnetLinksModal, setShowAnetLinksModal] = useState(false)
  const [showExternalLinksModal, setShowExternalLinksModal] = useState(false)
  const editor = useMemo(
    () => withHtml(withReact(withHistory(withAnetLink(createEditor())))),
    []
  )
  const [showFullSize, setShowFullSize] = useState(false)
  const [toolbarHeight, setToolbarHeight] = useState(0)
  const { topbarOffset, securityBannerOffset } = useContext(
    ResponsiveLayoutContext
  )
  const editableRef = useRef()
  const toolbarRef = useRef()

  const [slateValue, setSlateValue] = useState(createSlateValue(value))
  const previousValue = usePrevious(value)

  useEffect(() => {
    if (readOnly && previousValue !== undefined && previousValue !== value) {
      // Only update editor when a new value comes in
      // (different from the one used for slateValue above)
      editor.children = createSlateValue(value)
      editor.onChange()
    }
  }, [editor, previousValue, readOnly, disableFullSize, value])

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  const handleFullSizeMode = isFullSize => setShowFullSize(isFullSize)

  const makeToolbarAccessible = debounce(node => {
    if (showFullSize || readOnly) {
      return
    }
    const toolbarRect = toolbarRef.current?.getBoundingClientRect()
    if (!toolbarRect || toolbarRect.top >= topbarOffset) {
      return
    }
    smoothScrollIntoView(editableRef.current)
  }, 100)

  useEffect(() => {
    function updateToolbarHeight() {
      const curHeight = toolbarRef.current?.clientHeight || 0
      if (curHeight !== undefined && curHeight !== toolbarHeight) {
        setToolbarHeight(curHeight)
      }
    }
    if (!readOnly) {
      updateToolbarHeight()
      window.addEventListener("resize", updateToolbarHeight)
      // returned function will be called on component unmount
      return () => window.removeEventListener("resize", updateToolbarHeight)
    }
  }, [toolbarHeight, readOnly])

  return (
    <div className={className}>
      <Slate
        editor={editor}
        value={slateValue}
        onChange={newValue => {
          setSlateValue(newValue)
          serializeDebounced(editor, onChange)
          makeToolbarAccessible(editor)
        }}
      >
        <div
          className={classNames({
            "editor-container": !readOnly,
            "editor-container-fullsize": showFullSize
          })}
          style={{
            "--banner-height": `${securityBannerOffset}px`,
            "--toolbar-height": `${toolbarHeight}px`
          }}
          ref={editableRef}
        >
          {!readOnly && (
            <Toolbar
              showAnetLinksModal={showAnetLinksModal}
              setShowAnetLinksModal={setShowAnetLinksModal}
              showExternalLinksModal={showExternalLinksModal}
              setShowExternalLinksModal={setShowExternalLinksModal}
              showFullSize={showFullSize}
              setShowFullSize={handleFullSizeMode}
              disableFullSize={disableFullSize}
              toolbarRef={toolbarRef}
            />
          )}
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onBlur={onHandleBlur}
            onKeyDown={e =>
              handleOnKeyDown(
                e,
                editor,
                setShowAnetLinksModal,
                setShowExternalLinksModal,
                handleFullSizeMode,
                disableFullSize
              )
            }
            className={classNames("editable", {
              "editable-fullsize": showFullSize
            })}
            readOnly={readOnly}
            scrollSelectionIntoView={scrollSelectionIntoView}
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
  readOnly: PropTypes.bool,
  disableFullSize: PropTypes.bool
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
    LINK_TYPES.includes(element.type) ? true : isVoid(element)
  editor.isInline = element =>
    LINK_TYPES.includes(element.type) ? true : isInline(element)
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
  const children = LINK_TYPES.includes(node.type)
    ? node.children.reduce((acc, child) => acc + child.text, "")
    : node.children.map(n => serialize(n)).join("")
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
    case ANET_LINK:
    case EXTERNAL_LINK:
      return `<a href="${getUrlFromEntityInfo(node)}">${children}</a>`
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
        getEntityInfoFromUrl(element.getAttribute("href")),
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
    case ANET_LINK:
    case EXTERNAL_LINK: {
      const reducedChildren = element.children.reduce(
        (acc, child) => acc + child.text,
        ""
      )
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
          {element.type === ANET_LINK ? (
            <LinkAnetEntity
              type={element.entityType}
              uuid={element.entityUuid}
              displayCallback={displayCallback}
              children={reducedChildren}
            />
          ) : (
            <LinkExternalHref url={element.url} children={reducedChildren} />
          )}
          {children}
        </span>
      )
    }
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
