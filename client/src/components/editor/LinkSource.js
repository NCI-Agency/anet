import React, { Component } from "react"
import PropTypes from "prop-types"

import { RichUtils } from "draft-js"
import { Modal } from "react-bootstrap"

import createEntity from "./utils/createEntity"

import "./LinkSource.css"

class LinkSource extends Component {
  constructor(props) {
    super(props)

    const { entity } = this.props
    const state = {
      url: ""
    }

    if (entity) {
      const data = entity.getData()
      state.url = data.url
    }

    this.state = state

    this.onRequestClose = this.onRequestClose.bind(this)
    this.onAfterOpen = this.onAfterOpen.bind(this)
    this.onConfirm = this.onConfirm.bind(this)
    this.onChangeURL = this.onChangeURL.bind(this)
  }

  /* :: onConfirm: (e: Event) => void; */
  onConfirm(e) {
    const { editorState, entityType, onComplete } = this.props
    const { url } = this.state

    e.preventDefault()

    let nextState = editorState

    if (url) {
      const selection = editorState.getSelection()
      const entityData = {
        url: url.replace(/\s/g, "")
      }

      const hasText = !selection.isCollapsed()

      if (hasText) {
        const contentState = editorState.getCurrentContent()
        const contentStateWithEntity = contentState.createEntity(
          entityType.type,
          "MUTABLE",
          entityData
        )

        const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
        nextState = RichUtils.toggleLink(editorState, selection, entityKey)
      } else {
        nextState = createEntity(
          editorState,
          entityType.type,
          entityData,
          url,
          "MUTABLE"
        )
      }
    }

    onComplete(nextState)
  }

  /* :: onRequestClose: (e: SyntheticEvent<>) => void; */
  onRequestClose(e) {
    const { onClose } = this.props
    e.preventDefault()

    onClose()
  }

  /* :: onAfterOpen: () => void; */
  onAfterOpen() {
    const input = this.inputRef

    if (input) {
      input.focus()
      input.select()
    }
  }

  /* :: onChangeURL: (e: Event) => void; */
  onChangeURL(e) {
    if (e.target instanceof HTMLInputElement) {
      const url = e.target.value
      this.setState({ url })
    }
  }

  render() {
    const { url } = this.state
    return (
      <Modal
        show
        aria-labelledby="Link chooser"
        onHide={this.onRequestClose}
        onEntered={this.onAfterOpen}
      >
        <Modal.Header closeButton>
          <Modal.Title>Enter a valid url</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="LinkSource">
            <label className="form-field">
              <span className="form-field__label">Link URL</span>
              <input
                ref={inputRef => {
                  this.inputRef = inputRef
                }}
                type="text"
                onChange={this.onChangeURL}
                value={url}
                placeholder="www.example.com"
              />
            </label>

            <button type="button" onClick={this.onConfirm}>
              Save
            </button>
          </form>
        </Modal.Body>
      </Modal>
    )
  }
}

LinkSource.propTypes = {
  editorState: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  entityType: PropTypes.object.isRequired,
  entity: PropTypes.object
}

LinkSource.defaultProps = {
  entity: null
}

export default LinkSource
