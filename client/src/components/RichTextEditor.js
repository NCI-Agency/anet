import React, { Component } from "react"
import PropTypes from "prop-types"
import _isEqual from "lodash/isEqual"
import { convertFromHTML, convertToHTML } from "draft-convert"
import { convertToRaw, convertFromRaw } from "draft-js"
import { DraftailEditor, BLOCK_TYPE, ENTITY_TYPE, INLINE_STYLE } from "draftail"

import LinkAnet from "components/editor/LinkAnet"
import LinkSourceAnet from "components/editor/LinkSourceAnet"
import linkifyPlugin from "components/editor/plugins/linkifyPlugin"

import createSideToolbarPlugin from "draft-js-side-toolbar-plugin"
import createNewlinePlugin from "components/editor/plugins/newlinePlugin"

import "draft-js/dist/Draft.css"
import "draftail/dist/draftail.css"
import "draft-js-side-toolbar-plugin/lib/plugin.css"
import "components/RichTextEditor.css"

import {
  ItalicButton,
  BoldButton,
  UnderlineButton,
  HeadlineOneButton,
  HeadlineTwoButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton
} from "draft-js-buttons"

const linkify = linkifyPlugin()
const newlinePlugin = createNewlinePlugin()

const BLOCK_TYPES = [
  { type: BLOCK_TYPE.HEADER_ONE },
  { type: BLOCK_TYPE.HEADER_TWO },
  { type: BLOCK_TYPE.HEADER_THREE },
  { type: BLOCK_TYPE.BLOCKQUOTE },
  {
    type: BLOCK_TYPE.UNORDERED_LIST_ITEM,
    icon: [
      "m 96,107.19101 a 96,93.417462 0 1 0 96,93.41746 96,93.417462 0 0 0 -96,-93.41746 z m 0,311.39154 A 96,93.417462 0 1 0 192,512 96,93.417462 0 0 0 96,418.58255 Z m 0,311.39152 a 96,93.417462 0 1 0 96,93.41747 96,93.417462 0 0 0 -96,-93.41747 z m 896,31.13916 H 352 a 32,31.139153 0 0 0 -32,31.13915 v 62.27831 a 32,31.139153 0 0 0 32,31.13914 h 640 a 32,31.139153 0 0 0 32,-31.13914 v -62.27831 a 32,31.139153 0 0 0 -32,-31.13915 z m 0,-622.78306 H 352 a 32,31.139153 0 0 0 -32,31.13915 v 62.2783 a 32,31.139153 0 0 0 32,31.13916 h 640 a 32,31.139153 0 0 0 32,-31.13916 v -62.2783 a 32,31.139153 0 0 0 -32,-31.13915 z m 0,311.39153 H 352 a 32,31.139153 0 0 0 -32,31.13915 v 62.27831 a 32,31.139153 0 0 0 32,31.13915 h 640 a 32,31.139153 0 0 0 32,-31.13915 V 480.86085 A 32,31.139153 0 0 0 992,449.7217 Z"
    ]
  },
  {
    type: BLOCK_TYPE.ORDERED_LIST_ITEM,
    icon: [
      "m 123.54,843.67568 35,-46.07064 a 39.84,45.544767 0 0 0 10.14,-32.4438 v -7.56793 C 168.68,740.78839 161,731.64286 146,731.64286 H 32 a 16,18.291072 0 0 0 -16,18.29106 v 36.58216 a 16,18.291072 0 0 0 16,18.29106 h 45.66 a 314.82,359.89971 0 0 0 -22,28.14539 l -11.22,16.00468 c -8,11.59196 -10.5,23.16107 -5.6,34.02139 l 2.1,4.41272 c 6,13.16958 12.58,18.01671 24.5,18.01671 h 9.46 c 20.66,0 31.88,5.57879 31.88,20.78323 0,10.79175 -8.4,18.79409 -28.72,18.79409 a 83.08,94.976387 0 0 1 -30.94,-7.13353 c -12.98,-8.87118 -23.48,-8.00234 -31.2,7.13353 L 4.74,966.27156 c -7.44,14.01554 -6.38,26.79643 5.26,36.44494 15.42,10.7232 40.76,21.5835 74,21.5835 68.32,0 97,-52.01524 97,-100.87526 -0.06,-32.87821 -18.24,-68.04278 -57.46,-79.74906 z M 992,438.98572 H 352 a 32,36.582142 0 0 0 -32,36.58214 v 73.16428 a 32,36.582142 0 0 0 32,36.58215 h 640 a 32,36.582142 0 0 0 32,-36.58215 V 475.56786 A 32,36.582142 0 0 0 992,438.98572 Z M 992,73.16428 H 352 a 32,36.582142 0 0 0 -32,36.58214 v 73.1643 a 32,36.582142 0 0 0 32,36.58214 h 640 a 32,36.582142 0 0 0 32,-36.58214 v -73.1643 A 32,36.582142 0 0 0 992,73.16428 Z m 0,731.64286 H 352 a 32,36.582142 0 0 0 -32,36.58214 v 73.1643 a 32,36.582142 0 0 0 32,36.58214 h 640 a 32,36.582142 0 0 0 32,-36.58214 v -73.1643 a 32,36.582142 0 0 0 -32,-36.58214 z m -960,-512.15 h 128 a 16,18.291072 0 0 0 16,-18.29106 V 237.78392 A 16,18.291072 0 0 0 160,219.49286 H 128 V 18.29108 A 16,18.291072 0 0 0 112,0 H 64 A 16,18.291072 0 0 0 49.72,10.10583 l -16,36.58214 A 16,18.291072 0 0 0 48,73.16428 H 64 V 219.49286 H 32 a 16,18.291072 0 0 0 -16,18.29106 v 36.58216 a 16,18.291072 0 0 0 16,18.29106 z M 24.18,658.47858 H 160 A 16,18.291072 0 0 0 176,640.1875 V 603.60536 A 16,18.291072 0 0 0 160,585.31429 H 82.64 c 6.58,-23.5269 96.68,-42.70966 96.68,-129.04351 0,-66.44231 -50,-90.44936 -88.94,-90.44936 -42.72,0 -67.6,22.86386 -80.92,42.86971 -8.74,12.78089 -6,24.7844 5.6,35.14172 l 17.16,15.73032 c 11.22,10.42591 22,5.64737 32.24,-5.57878 a 26.88,30.729 0 0 1 18.92,-8.77971 c 6.66,0 18.56,3.56676 18.56,20.00586 C 102,494.29334 0,515.14516 0,623.24539 v 9.14554 c 0,16.9421 10.16,26.08765 24.18,26.08765 z"
    ]
  }
]

const INLINE_STYLES = [
  { type: INLINE_STYLE.BOLD },
  { type: INLINE_STYLE.ITALIC },
  {
    type: INLINE_STYLE.UNDERLINE,
    icon: [
      "m -110.45248,-36.817494 h 28.503379 v 25.631677 h -28.503379 z",
      "m 529.75865,840.37772 c 158.31765,0 286.98061,-119.02958 286.98061,-265.4935 V 220.89293 H 697.16399 v 353.99129 c 0,85.4004 -75.09325,154.8712 -167.40534,154.8712 -92.3121,0 -167.40535,-69.4708 -167.40535,-154.8712 V 220.89293 H 242.77804 v 353.99129 c 0,146.46392 128.66297,265.4935 286.98061,265.4935 z m -334.81072,88.49784 v 88.49774 h 669.62145 v -88.49774 z"
    ]
  },
  { type: INLINE_STYLE.STRIKETHROUGH },
  { type: INLINE_STYLE.MARK }
]

const ENTITY_CONTROL = {
  LINK: {
    type: ENTITY_TYPE.LINK,
    description: "Add a link to an ANET entity",
    label: "ANET link",
    icon: [
      "M440.236 635.766c-13.31 0-26.616-5.076-36.77-15.23-95.134-95.136-95.134-249.934 0-345.070l192-192c46.088-46.086 107.36-71.466 172.534-71.466s126.448 25.38 172.536 71.464c95.132 95.136 95.132 249.934 0 345.070l-87.766 87.766c-20.308 20.308-53.23 20.308-73.54 0-20.306-20.306-20.306-53.232 0-73.54l87.766-87.766c54.584-54.586 54.584-143.404 0-197.99-26.442-26.442-61.6-41.004-98.996-41.004s-72.552 14.562-98.996 41.006l-192 191.998c-54.586 54.586-54.586 143.406 0 197.992 20.308 20.306 20.306 53.232 0 73.54-10.15 10.152-23.462 15.23-36.768 15.23z",
      "M256 1012c-65.176 0-126.45-25.38-172.534-71.464-95.134-95.136-95.134-249.934 0-345.070l87.764-87.764c20.308-20.306 53.234-20.306 73.54 0 20.308 20.306 20.308 53.232 0 73.54l-87.764 87.764c-54.586 54.586-54.586 143.406 0 197.992 26.44 26.44 61.598 41.002 98.994 41.002s72.552-14.562 98.998-41.006l192-191.998c54.584-54.586 54.584-143.406 0-197.992-20.308-20.308-20.306-53.232 0-73.54 20.306-20.306 53.232-20.306 73.54 0.002 95.132 95.134 95.132 249.932 0.002 345.068l-192.002 192c-46.090 46.088-107.364 71.466-172.538 71.466z"
    ],
    source: LinkSourceAnet,
    decorator: LinkAnet,
    attributes: ["url", "value", "objectType"],
    whitelist: {
      href: "^(?![#/])"
    }
  }
}

const importerConfig = {
  htmlToEntity: (nodeName, node, createEntity) => {
    // a tags will become LINK entities, marked as mutable, with only the URL as data.
    if (nodeName === "a") {
      // return createEntity(ENTITY_TYPE.LINK, "IMMUTABLE", { url: node.href }
      return createEntity(ENTITY_TYPE.LINK, "IMMUTABLE", {
        url: node.href,
        value: node.href
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
  },
  htmlToStyle: (nodeName, node, currentStyle) => {
    if (nodeName === "mark") {
      return currentStyle.add(INLINE_STYLE.MARK)
    }
    return currentStyle
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
  },

  styleToHTML: style => {
    if (style === INLINE_STYLE.STRIKETHROUGH) {
      return <strike />
    }

    if (style === INLINE_STYLE.MARK) {
      return <mark />
    }
  }
}

const fromHTML = html => convertToRaw(convertFromHTML(importerConfig)(html))
const toHTML = raw =>
  raw ? convertToHTML(exporterConfig)(convertFromRaw(raw)) : ""

class RichTextEditor extends Component {
  constructor(props) {
    super(props)

    this.state = {
      sideToolbarPlugin: createSideToolbarPlugin(),
      content: {}
    }
    this.focus = () => this.refs.editor.focus()
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_isEqual(this.state.content, nextState.content)
  }

  render() {
    const { className, value, onChange, onHandleBlur } = this.props
    const { sideToolbarPlugin } = this.state
    const { SideToolbar } = sideToolbarPlugin
    return (
      <div className={className} onClick={this.focus}>
        <DraftailEditor
          ref="editor"
          id="rich-text"
          ariaDescribedBy="rich-text-editor"
          blockTypes={BLOCK_TYPES}
          entityTypes={[ENTITY_CONTROL.LINK]}
          inlineStyles={INLINE_STYLES}
          maxListNesting={4}
          onSave={rawContent => {
            if (onHandleBlur) {
              onChange(toHTML(rawContent))
            }
          }}
          plugins={[sideToolbarPlugin, linkify, newlinePlugin]}
          rawContentState={value ? fromHTML(value) : null}
          showUndoControl
          showRedoControl
          spellCheck
          stripPastedStyles={false}
          bottomToolbar={props => (
            <>
              <SideToolbar>
                {externalProps => (
                  <>
                    <HeadlineOneButton {...externalProps} />
                    <HeadlineTwoButton {...externalProps} />
                    <BlockquoteButton {...externalProps} />
                    <ItalicButton {...externalProps} />
                    <BoldButton {...externalProps} />
                    <UnderlineButton {...externalProps} />
                    <UnorderedListButton {...externalProps} />
                    <OrderedListButton {...externalProps} />
                  </>
                )}
              </SideToolbar>
            </>
          )}
        />
      </div>
    )
  }
}

RichTextEditor.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onHandleBlur: PropTypes.func
}

export default RichTextEditor
