import * as Models from "models"
import PropTypes from "prop-types"
import React from "react"
import { Modal } from "react-bootstrap"
import "./LinkSource.css"
import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import createEntity from "./utils/createEntity"

const LinkSourceAnet = ({ editorState, entityType, onComplete, onClose }) => {
  function onConfirm(value, objectType) {
    // Retrieve entity URL and label
    const ModelClass = Models[objectType]
    const modelInstance = new ModelClass(value)
    const entityLabel = modelInstance.toString()
    const entityUrl = ModelClass.pathFor(modelInstance)

    const nextState = createEntity(
      editorState,
      entityType.type,
      {
        url: entityUrl
      },
      entityLabel,
      "IMMUTABLE"
    )

    onComplete(nextState)
  }

  return (
    <Modal show aria-labelledby="Link chooser" onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Link to ANET entity</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <MultiTypeAdvancedSelectComponent onConfirm={onConfirm} />
      </Modal.Body>
    </Modal>
  )
}

LinkSourceAnet.propTypes = {
  editorState: PropTypes.object,
  entityType: PropTypes.object,
  onComplete: PropTypes.func,
  onClose: PropTypes.func
}

export default LinkSourceAnet
