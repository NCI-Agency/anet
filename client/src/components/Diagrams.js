import Fieldset from "components/Fieldset"
import BoardDashboard from "pages/dashboards/BoardDashboard"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import "./Diagrams.css"

const DiagramsContainer = ({ diagrams, relatedObject, onDiagramUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedDiagram, setSelectedDiagram] = useState(null)

  return (
    <Fieldset title="Diagrams" id="diagrams">
      {diagrams.map(diagram => (
        <Diagram
          key={diagram.uuid}
          diagram={diagram}
          onSelect={() => {
            setSelectedDiagram(diagram)
            setShowModal(true)
          }}
          relatedObject={relatedObject}
        />
      ))}
      <Button
        onClick={() => {
          setSelectedDiagram(null)
          setShowModal(true)
        }}
      >
        Create New
      </Button>
      <Modal
        centered
        size="xl"
        show={showModal}
        onHide={() => setShowModal(false)}
        style={{ zIndex: "1300" }}
      >
        <Modal.Header closeButton>Diagram Modal</Modal.Header>
        <Modal.Body>
          <div className="process-diagram" style={{ height: "600px" }}>
            <BoardDashboard
              diagramNote={selectedDiagram}
              readonly={false}
              relatedObject={relatedObject}
              onUpdate={() => {
                onDiagramUpdate()
                setShowModal(false)
              }}
            />
          </div>
        </Modal.Body>
      </Modal>
    </Fieldset>
  )
}

DiagramsContainer.propTypes = {
  diagrams: PropTypes.array,
  relatedObject: PropTypes.object,
  onDiagramUpdate: PropTypes.func
}

const Diagram = ({ diagram, onSelect, relatedObject }) => {
  const [diagramHeight, setDiagramHeight] = useState(300)
  return (
    <div className="process-diagram" style={{ height: `${diagramHeight}px` }}>
      <div className="diagram-header">
        <div>{diagram.uuid}</div>
        <Button variant="outline-secondary" onClick={onSelect}>
          Edit
        </Button>
      </div>
      <BoardDashboard
        diagramNote={diagram}
        readonly={true}
        relatedObject={relatedObject}
        diagramHeight={diagramHeight}
        setDiagramHeight={setDiagramHeight}
      />
    </div>
  )
}

Diagram.propTypes = {
  diagram: PropTypes.object,
  onSelect: PropTypes.func,
  relatedObject: PropTypes.object
}

export default DiagramsContainer
