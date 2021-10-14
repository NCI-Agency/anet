import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import PropTypes from "prop-types"
import React, { useCallback } from "react"
import { Modal } from "react-bootstrap"
import { Transforms } from "slate"

const LinkSourceAnet = ({ editor, showModal, setShowModal, selection }) => {
  const insertAnetObject = useCallback(
    (value, objectType) => {
      const anetLinkNode = createAnetLinkNode(objectType, value.uuid)

      if (selection) {
        Transforms.insertNodes(editor, anetLinkNode, {
          at: { path: selection.focus.path, offset: selection.focus.offset },
          select: true
        })
      } else {
        Transforms.insertNodes(editor, anetLinkNode, {
          select: true
        })
      }
      setShowModal(false)
    },
    [editor, selection, setShowModal]
  )
  return (
    <Modal
      centered
      show={showModal}
      aria-labelledby="Link chooser"
      onHide={() => setShowModal(false)}
    >
      <Modal.Header closeButton>
        <Modal.Title>Link to ANET entity</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <MultiTypeAdvancedSelectComponent onConfirm={insertAnetObject} />
      </Modal.Body>
    </Modal>
  )
}

LinkSourceAnet.propTypes = {
  editor: PropTypes.object.isRequired,
  showModal: PropTypes.bool,
  setShowModal: PropTypes.func.isRequired,
  selection: PropTypes.object
}

function createAnetLinkNode(entityType, entityUuid) {
  return {
    type: "anet-link",
    entityType: entityType,
    entityUuid: entityUuid,
    children: [{ text: "" }]
  }
}

export default LinkSourceAnet
