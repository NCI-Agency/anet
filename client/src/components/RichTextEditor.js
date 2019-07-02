import React from "react"
import PropTypes from "prop-types"
import { convertFromHTML, convertToHTML } from "draft-convert"
import { convertToRaw, convertFromRaw } from "draft-js"
import { DraftailEditor, BLOCK_TYPE, ENTITY_TYPE, INLINE_STYLE } from "draftail"

import Link from "components/editor/Link"
import LinkSource from "components/editor/LinkSource"
import linkifyPlugin from "components/editor/plugins/linkifyPlugin"
import createNewlinePlugin from "components/editor/plugins/newlinePlugin"

import "draft-js/dist/Draft.css"
import "draftail/dist/draftail.css"
import "components/RichTextEditor.css"

const linkify = linkifyPlugin()
const newlinePlugin = createNewlinePlugin()

const BLOCK_TYPES = [
  { type: BLOCK_TYPE.HEADER_ONE },
  { type: BLOCK_TYPE.HEADER_TWO },
  { type: BLOCK_TYPE.HEADER_THREE },
  { type: BLOCK_TYPE.HEADER_FOUR },
  { type: BLOCK_TYPE.HEADER_FIVE },
  { type: BLOCK_TYPE.HEADER_SIX },
  { type: BLOCK_TYPE.BLOCKQUOTE },
  { type: BLOCK_TYPE.UNORDERED_LIST_ITEM },
  { type: BLOCK_TYPE.ORDERED_LIST_ITEM }
]

const INLINE_STYLES = [
  { type: INLINE_STYLE.BOLD },
  { type: INLINE_STYLE.ITALIC },
  { type: INLINE_STYLE.UNDERLINE }
]

const ENTITY_CONTROL = {
  LINK: {
    type: ENTITY_TYPE.LINK,
    description: "Link",
    icon: [
      "M440.236 635.766c-13.31 0-26.616-5.076-36.77-15.23-95.134-95.136-95.134-249.934 0-345.070l192-192c46.088-46.086 107.36-71.466 172.534-71.466s126.448 25.38 172.536 71.464c95.132 95.136 95.132 249.934 0 345.070l-87.766 87.766c-20.308 20.308-53.23 20.308-73.54 0-20.306-20.306-20.306-53.232 0-73.54l87.766-87.766c54.584-54.586 54.584-143.404 0-197.99-26.442-26.442-61.6-41.004-98.996-41.004s-72.552 14.562-98.996 41.006l-192 191.998c-54.586 54.586-54.586 143.406 0 197.992 20.308 20.306 20.306 53.232 0 73.54-10.15 10.152-23.462 15.23-36.768 15.23z",
      "M256 1012c-65.176 0-126.45-25.38-172.534-71.464-95.134-95.136-95.134-249.934 0-345.070l87.764-87.764c20.308-20.306 53.234-20.306 73.54 0 20.308 20.306 20.308 53.232 0 73.54l-87.764 87.764c-54.586 54.586-54.586 143.406 0 197.992 26.44 26.44 61.598 41.002 98.994 41.002s72.552-14.562 98.998-41.006l192-191.998c54.584-54.586 54.584-143.406 0-197.992-20.308-20.308-20.306-53.232 0-73.54 20.306-20.306 53.232-20.306 73.54 0.002 95.132 95.134 95.132 249.932 0.002 345.068l-192.002 192c-46.090 46.088-107.364 71.466-172.538 71.466z"
    ],
    source: LinkSource,
    decorator: Link,
    attributes: ["url"],
    whitelist: {
      href: "^(?![#/])"
    }
  }
}

const importerConfig = {
  htmlToEntity: (nodeName, node, createEntity) => {
    // a tags will become LINK entities, marked as mutable, with only the URL as data.
    if (nodeName === "a") {
      return createEntity(ENTITY_TYPE.LINK, "MUTABLE", { url: node.href })
    }

    if (nodeName === "hr") {
      return createEntity(ENTITY_TYPE.HORIZONTAL_RULE, "IMMUTABLE", {})
    }

    return null
  },
  htmlToBlock: nodeName => {
    if (nodeName === "hr" || nodeName === "img") {
      // "atomic" blocks is how Draft.js structures block-level entities.
      return "atomic"
    }

    return null
  }
}

const exporterConfig = {
  blockToHTML: block => {
    if (block.type === BLOCK_TYPE.BLOCKQUOTE) {
      return <blockquote />
    }

    // Discard atomic blocks, as they get converted based on their entity.
    if (block.type === BLOCK_TYPE.ATOMIC) {
      return {
        start: "",
        end: ""
      }
    }

    return null
  },

  entityToHTML: (entity, originalText) => {
    if (entity.type === ENTITY_TYPE.LINK) {
      return <a href={entity.data.url}>{originalText}</a>
    }

    if (entity.type === ENTITY_TYPE.HORIZONTAL_RULE) {
      return <hr />
    }

    return originalText
  }
}

const fromHTML = html => convertToRaw(convertFromHTML(importerConfig)(html))
const toHTML = raw =>
  raw ? convertToHTML(exporterConfig)(convertFromRaw(raw)) : ""

const RichTextEditor = ({ value, onChange }) => (
  <DraftailEditor
    id="rich-text"
    ariaDescribedBy="rich-text-editor"
    blockTypes={BLOCK_TYPES}
    enableHorizontalRule
    entityTypes={[ENTITY_CONTROL.LINK]}
    inlineStyles={INLINE_STYLES}
    maxListNesting={4}
    onSave={raw => {
      onChange(toHTML(raw))
    }}
    plugins={[linkify, newlinePlugin]}
    rawContentState={value ? fromHTML(value) : null}
    showUndoControl
    showRedoControl
    spellCheck
    stripPastedStyles={false}
  />
)

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
}

export default RichTextEditor
