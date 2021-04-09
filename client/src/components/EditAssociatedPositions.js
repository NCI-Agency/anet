import React, { useState } from "react"
import { Button } from "@blueprintjs/core"
import { Modal, Row, Col, Grid } from "react-bootstrap"
import PropTypes from "prop-types"
import AssociatedPositions from "../pages/positions/AssociatedPositions"

function EditAssociatedPositions({
  associatedPositions1,
  associatedPositions2,
  title,
  setAssociatedPositions,
  initialMergedAssociatedPositions
}) {
  const [showModal, setShowModal] = useState(false)
  const [finalAssociatedPositions, setFinalAssociatedPositions] = useState(
    initialMergedAssociatedPositions
  )
  return (
    <div
      className="edit-associated-positions"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Button
        intent="primary"
        onClick={() => {
          setShowModal(true)
          setFinalAssociatedPositions(initialMergedAssociatedPositions)
        }}
      >
        Edit Associated Positions
      </Button>
      <Modal
        show={showModal}
        onHide={onHide}
        dialogClassName="edit-history-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Grid fluid>
            <Row>
              <Col md={4}>
                <AssociatedPositions
                  associatedPositions={associatedPositions1}
                  action={(item, index) => (
                    <Button
                      onClick={() => editItem(item)}
                      intent={isInMerged(item) ? "danger" : "primary"}
                    >
                      {isInMerged(item) ? "Remove" : "Add"}
                    </Button>
                  )}
                />
              </Col>
              <Col md={4}>
                <AssociatedPositions
                  associatedPositions={finalAssociatedPositions}
                  action={(item, index) => (
                    <Button onClick={() => editItem(item)} intent="danger">
                      Remove
                    </Button>
                  )}
                />
              </Col>
              <Col md={4}>
                <AssociatedPositions
                  associatedPositions={associatedPositions2}
                  action={(item, index) => (
                    <Button
                      onClick={() => editItem(item)}
                      intent={isInMerged(item) ? "danger" : "primary"}
                    >
                      {isInMerged(item) ? "Remove" : "Add"}
                    </Button>
                  )}
                />
              </Col>
            </Row>
            <Row>
              <div className="submit-buttons">
                <div>
                  <Button onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
                <div>
                  <Button onClick={onSave}>Save</Button>
                </div>
              </div>
            </Row>
          </Grid>
        </Modal.Body>
      </Modal>
    </div>
  )

  function onHide() {
    setShowModal(false)
  }

  function editItem(item) {
    isInMerged(item) ? removeItem(item) : addItem(item)
  }

  function isInMerged(item) {
    if (
      finalAssociatedPositions.filter(ap => ap.uuid === item.uuid).length > 0
    ) {
      return true
    } else {
      return false
    }
  }

  function removeItem(item) {
    setFinalAssociatedPositions(
      finalAssociatedPositions.filter(ap => ap.uuid !== item.uuid)
    )
  }

  function addItem(item) {
    setFinalAssociatedPositions([...finalAssociatedPositions, item])
  }

  function onSave() {
    setAssociatedPositions(finalAssociatedPositions)
    setShowModal(false)
  }
}

EditAssociatedPositions.propTypes = {
  associatedPositions1: PropTypes.array,
  associatedPositions2: PropTypes.array,
  title: PropTypes.string,
  setAssociatedPositions: PropTypes.func,
  initialMergedAssociatedPositions: PropTypes.array
}

EditAssociatedPositions.defaultProps = {
  title: "Edit Associated Positions"
}

export default EditAssociatedPositions
