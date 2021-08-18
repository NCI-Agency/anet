import { Button } from "@blueprintjs/core"
import AssociatedPositions from "components/AssociatedPositions"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, Grid, Modal, Row } from "react-bootstrap"

const EditAssociatedPositions = ({
  associatedPositions1,
  associatedPositions2,
  title,
  setAssociatedPositions,
  initialMergedAssociatedPositions
}) => {
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
        dialogClassName="edit-history-dialog-lg"
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
                  action={item => (
                    <Button
                      icon=""
                      rightIcon="double-chevron-right"
                      intent={isInMerged(item) ? "success" : "primary"}
                      onClick={() => addItem(item)}
                      style={{ textAlign: "center" }}
                    />
                  )}
                />
              </Col>
              <Col md={4}>
                <h2 style={{ textAlign: "center" }}>
                  Merged Associated Positions
                </h2>
                <AssociatedPositions
                  associatedPositions={finalAssociatedPositions}
                  action={item => (
                    <Button
                      icon="delete"
                      outlined
                      intent="danger"
                      onClick={() => removeItem(item)}
                    />
                  )}
                />
              </Col>
              <Col md={4}>
                <AssociatedPositions
                  associatedPositions={associatedPositions2}
                  action={item => (
                    <Button
                      icon="double-chevron-left"
                      rightIcon=""
                      intent={isInMerged(item) ? "success" : "primary"}
                      onClick={() => addItem(item)}
                      style={{ textAlign: "center" }}
                    />
                  )}
                  actionSide="left"
                />
              </Col>
            </Row>
          </Grid>
        </Modal.Body>
        <Modal.Footer>
          <Button className="pull-left" onClick={onHide}>
            Cancel
          </Button>

          <Button intent="primary" onClick={onSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )

  function onHide() {
    setShowModal(false)
  }

  function isInMerged(item) {
    return finalAssociatedPositions.find(ap => ap.uuid === item.uuid)
  }

  function removeItem(item) {
    setFinalAssociatedPositions(
      finalAssociatedPositions.filter(ap => ap.uuid !== item.uuid)
    )
  }

  function addItem(item) {
    !isInMerged(item) &&
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
  setAssociatedPositions: PropTypes.func.isRequired,
  initialMergedAssociatedPositions: PropTypes.array
}

EditAssociatedPositions.defaultProps = {
  title: "Edit Associated Positions"
}

export default EditAssociatedPositions
