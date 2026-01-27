import classNames from "classnames"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import LinkExternalHref from "components/editor/LinkExternalHref"
import "components/editor/RichTextEditor.css"
import Toolbar, { handleOnKeyDown } from "components/editor/Toolbar"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import escapeHtml from "escape-html"
import _debounce from "lodash/debounce"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import scrollIntoView from "scroll-into-view-if-needed"
import Settings from "settings"
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
import utils from "utils"
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

const ELEMENT_TAGS = {
  A: el => getEntityInfoFromUrl(el.getAttribute("href")),
  BLOCKQUOTE: () => ({ type: "block-quote" }),
  CITE: () => ({ type: "block-quote" }),
  H1: () => ({ type: "heading-one" }),
  H2: () => ({ type: "heading-two" }),
  H3: () => ({ type: "heading-three" }),
  P: () => ({ type: "paragraph" }),
  LI: () => ({ type: "list-item" }),
  OL: () => ({ type: "numbered-list" }),
  UL: () => ({ type: "bulleted-list" }),
  IMG: el => ({ type: "image", url: el.getAttribute("src") })
}

interface RichTextEditorProps {
  value?: string
  placeholder?: string
  onChange?: (...args: unknown[]) => unknown
  onHandleBlur?: (...args: unknown[]) => unknown
  className?: string
  style?: any
  readOnly?: boolean
  disableFullSize?: boolean
  showAvatar?: boolean
}

const RichTextEditor = ({
  value,
  placeholder,
  onChange,
  onHandleBlur,
  className,
  style,
  readOnly,
  disableFullSize,
  showAvatar = true
}: RichTextEditorProps) => {
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
    if (readOnly && previousValue !== value) {
      // Only update editor when a new value comes in
      // (different from the one used for slateValue above)
      editor.children = createSlateValue(value)
      editor.onChange()
    }
  }, [editor, previousValue, readOnly, disableFullSize, value])

  const renderElement = useCallback(
    props => <Element {...props} showAvatar={showAvatar} />,
    [showAvatar]
  )
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  const handleFullSizeMode = isFullSize => setShowFullSize(isFullSize)

  const makeToolbarAccessible = _debounce(() => {
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
    <div className={className} style={style}>
      <Slate
        editor={editor}
        initialValue={slateValue}
        onValueChange={newValue => {
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
            placeholder={placeholder}
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
      Transforms.insertFragment(editor, nodes)
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
    case ANET_LINK:
      return `<a href="${getUrlFromEntityInfo(node)}">${node.entityType}:${
        node.entityUuid
      }</a>`
    case EXTERNAL_LINK:
      return `<a href="${getUrlFromEntityInfo(node)}">${children}</a>`
    default:
      return children
  }
}

const serializeDebounced = _debounce((node, onChange) => {
  const serialized = serialize(node)
  onChange?.(serialized)
  return serialized
}, 100)

const deserialize = (el, markAttributes = {}) => {
  if (el.nodeType === Node.TEXT_NODE) {
    return el.parentNode?.nodeName === "BODY"
      ? jsx("element", { type: "paragraph" }, el.textContent)
      : jsx("text", markAttributes, el.textContent)
  } else if (el.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const nodeAttributes = { ...markAttributes }

  // define attributes for text nodes
  switch (el.nodeName) {
    case "STRONG":
    case "B":
      nodeAttributes.bold = true
      break
    case "EM":
    case "I":
      nodeAttributes.italic = true
      break
    case "STRIKE":
      nodeAttributes.strikethrough = true
      break
    case "U":
      nodeAttributes.underline = true
      break
    default:
      break
  }

  let children = Array.from(el.childNodes)
    .map(node => deserialize(node, nodeAttributes))
    .flat()

  if (el.nodeName !== "#text" && _isEmpty(children)) {
    children =
      el.nodeName === "BODY"
        ? jsx("element", { type: "paragraph" }, [{ text: "" }])
        : [{ text: "" }]
  }

  if (children.length === 0) {
    children.push(jsx("text", nodeAttributes, ""))
  }

  if (ELEMENT_TAGS[el.nodeName]) {
    const attrs = ELEMENT_TAGS[el.nodeName](el)
    if (attrs.type === ANET_LINK) {
      attrs.url = getUrlFromEntityInfo(attrs)
      children = [{ text: "" }]
    }
    return jsx("element", attrs, children)
  }

  switch (el.nodeName) {
    case "BODY":
      return jsx("fragment", {}, children)
    case "BR":
      return "\n"
    default:
      return children
  }
}

function isImageAttachment(entity: any) {
  return (
    entity instanceof Models.Attachment &&
    entity?.mimeType?.startsWith("image/")
  )
}

function showIconCallback(entity: any) {
  return !isImageAttachment(entity)
}

const displayCallback = modelInstance => {
  if (modelInstance instanceof Models.Report) {
    const title = utils.ellipsizeOnWords(
      modelInstance.intent,
      utils.getMaxTextFieldLength(Settings.fields.report.intent, 40)
    )
    if (title) {
      return title
    }
  } else if (isImageAttachment(modelInstance)) {
    return (
      <div className="rich-text-image-wrapper">
        <img
          className="rich-text-image"
          src={`/api/attachment/view/${modelInstance.uuid}`}
          alt={modelInstance.caption}
        />
        {modelInstance.caption && (
          <div className="rich-text-image-caption">{modelInstance.caption}</div>
        )}
      </div>
    )
  }
  return modelInstance.toString()
}

const getLink = (
  element,
  children,
  attributes,
  selected,
  focused,
  showAvatar
) => {
  const reducedChildren = element.children.reduce(
    (acc, child) => acc + child.text,
    ""
  )
  const linkElement =
    element.type === ANET_LINK ? (
      <LinkAnetEntity
        type={element.entityType}
        uuid={element.entityUuid}
        displayCallback={displayCallback}
        showIcon={showIconCallback}
        showAvatar={showAvatar}
      >
        {reducedChildren}
      </LinkAnetEntity>
    ) : (
      <LinkExternalHref url={element.url} attributes={attributes}>
        {reducedChildren}
      </LinkExternalHref>
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
      {linkElement}
      {children}
    </span>
  )
}

interface ElementProps {
  attributes: any
  children?: React.ReactNode
  element?: any
  showAvatar?: boolean
}

const Element = ({
  attributes,
  children,
  element,
  showAvatar
}: ElementProps) => {
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
    case EXTERNAL_LINK:
      return getLink(
        element,
        children,
        attributes,
        selected,
        focused,
        showAvatar
      )
    default:
      return <p {...attributes}>{children}</p>
  }
}

interface LeafProps {
  attributes: any
  children?: React.ReactNode
  leaf?: any
}

const Leaf = ({ attributes, children, leaf }: LeafProps) => {
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

export default RichTextEditor
