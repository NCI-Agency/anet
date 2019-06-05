import React from "react"
import { convertFromHTML, convertToHTML } from "draft-convert"
import { convertToRaw, convertFromRaw } from "draft-js"
import { DraftailEditor, BLOCK_TYPE, ENTITY_TYPE, INLINE_STYLE } from "draftail"

import createLinkifyPlugin from "draft-js-linkify-plugin"

import Link from "components/editor/Link"
import LinkSource from "components/editor/LinkSource"
import ImageSource from "components/editor/ImageSource"
import ImageBlock from "components/editor/ImageBlock"

import "draft-js/dist/Draft.css"
import "draftail/dist/draftail.css"
import "components/RichTextEditor.css"

const linkifyPlugin = createLinkifyPlugin()

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
    source: LinkSource,
    decorator: Link,
    attributes: ["url"],
    whitelist: {
      href: "^(?![#/])"
    }
  },
  IMAGE: {
    type: ENTITY_TYPE.IMAGE,
    description: "Image",
    source: ImageSource,
    block: ImageBlock,
    attributes: ["src", "alt"],
    whitelist: {
      src: "^(?!(data:|file:))"
    }
  }
}

const content = `
<p>This editor demonstrates <strong>HTML import and export</strong>.</p>
<hr />
<blockquote>Built with <a href="http://localhost:3000/reports/f486b7a7-2af2-450d-af45-920d4ea8c80a">Report-Org-25th june</a></blockquote>
<img src="/static/example-lowres-image2.jpg"/>
    <p></p>
`

const importerConfig = {
  htmlToEntity: (nodeName, node, createEntity) => {
    // a tags will become LINK entities, marked as mutable, with only the URL as data.
    if (nodeName === "a") {
      return createEntity(ENTITY_TYPE.LINK, "MUTABLE", { url: node.href })
    }

    if (nodeName === "img") {
      return createEntity(ENTITY_TYPE.IMAGE, "IMMUTABLE", {
        src: node.src
      })
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

    if (entity.type === ENTITY_TYPE.IMAGE) {
      return <img src={entity.data.src} alt={entity.data.alt} />
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

const onSave = content => {
  console.log("saving", content)
  toHTML(content)
}
const RichTextEditor = () => (
  <DraftailEditor
    id="rich-text"
    ariaDescribedBy="rich-text-editor"
    blockTypes={BLOCK_TYPES}
    enableHorizontalRule
    entityTypes={[ENTITY_CONTROL.LINK, ENTITY_CONTROL.IMAGE]}
    inlineStyles={INLINE_STYLES}
    maxListNesting={4}
    onSave={onSave}
    plugins={[linkifyPlugin]}
    rawContentState={null}
    showUndoControl
    showRedoControl
    spellCheck
    stripPastedStyles={false}
  />
)

export default RichTextEditor
