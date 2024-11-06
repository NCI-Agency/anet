import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import AssociatedPositions from "components/AssociatedPositions"
import RemoveButton from "components/RemoveButton"
import React, { useState } from "react"
import { Button, Col, Container, Modal, Row } from "react-bootstrap"

interface EditAssociatedPositionsProps {
  associatedPositions1?: any[]
  associatedPositions2?: any[]
  title?: string
  setAssociatedPositions: (...args: unknown[]) => unknown
  initialMergedAssociatedPositions?: any[]
}

const EditAssociatedPositions = ({
  associatedPositions1,
  associatedPositions2,
  title,
  setAssociatedPositions,
  initialMergedAssociatedPositions
}: EditAssociatedPositionsProps) => {
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
        variant="outline-secondary"
        onClick={() => {
          setShowModal(true)
          setFinalAssociatedPositions(initialMergedAssociatedPositions)
        }}
      >
        Edit Associated Positions
      </Button>
      <Modal
        centered
        size="xl"
        show={showModal}
        onHide={onHide}
        dialogClassName="edit-associated-positions-dialog"
        style={{ zIndex: "1300" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container fluid>
            <Row>
              <Col md={4} id="edit-ap-left">
                <AssociatedPositions
                  associatedPositions={associatedPositions1}
                  action={item => (
                    <Button
                      variant={isInMerged(item) ? "success" : "primary"}
                      onClick={() => addItem(item)}
                      style={{ textAlign: "center" }}
                    >
                      <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
                    </Button>
                  )}
                />
              </Col>
              <Col md={4} id="edit-ap-mid">
                <h2 style={{ textAlign: "center" }}>
                  Merged Associated Positions
                </h2>
                <AssociatedPositions
                  associatedPositions={finalAssociatedPositions}
                  action={item => (
                    <RemoveButton onClick={() => removeItem(item)} />
                  )}
                />
              </Col>
              <Col md={4} id="edit-ap-right">
                <AssociatedPositions
                  associatedPositions={associatedPositions2}
                  action={item => (
                    <Button
                      variant={isInMerged(item) ? "success" : "primary"}
                      onClick={() => addItem(item)}
                      style={{ textAlign: "center" }}
                    >
                      <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />
                    </Button>
                  )}
                  actionSide="left"
                />
              </Col>
            </Row>
          </Container>
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
    return finalAssociatedPositions?.find(ap => ap.uuid === item.uuid)
  }

  function removeItem(item) {
    setFinalAssociatedPositions(
      finalAssociatedPositions?.filter(ap => ap.uuid !== item.uuid)
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

EditAssociatedPositions.defaultProps = {
  title: "Edit Associated Positions"
}

export default EditAssociatedPositions
