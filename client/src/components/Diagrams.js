import BoardDashboard from "components/BoardDashboard"
import { InputField } from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { FastField, Formik } from "formik"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import utils from "utils"
import * as yup from "yup"
import "./Diagrams.css"

const DiagramsContainer = ({
  diagrams,
  relatedObject,
  entityType,
  onDiagramUpdate
}) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedDiagram, setSelectedDiagram] = useState({})
  const [error, setError] = useState(null)
  const yupSchema = yup.object().shape({
    title: yup.string().required()
  })
  return (
    <Fieldset title="Diagrams" id="diagrams">
      {diagrams.map(diagram => {
        const parsedNoteText = utils.parseJsonSafe(diagram.text)
        const diagramData = {
          uuid: diagram.uuid,
          title: parsedNoteText.title,
          data: parsedNoteText.data
        }
        return (
          <Diagram
            key={diagram.uuid}
            diagramData={diagramData}
            onSelect={() => {
              setSelectedDiagram(diagramData)
              setShowModal(true)
            }}
            relatedObject={relatedObject}
          />
        )
      })}
      <Button
        onClick={() => {
          setSelectedDiagram({})
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
        <Modal.Header closeButton>
          {selectedDiagram.title || selectedDiagram.uuid || "New Diagram"}
        </Modal.Header>
        <Modal.Body>
          <Formik
            enableReinitialize
            initialValues={selectedDiagram}
            validationSchema={yupSchema}
            validateOnMount
          >
            {({ values, isValid }) => {
              return (
                <>
                  <Messages error={error} />
                  <div className="process-diagram" style={{ height: "600px" }}>
                    <FastField name="title" component={InputField} />

                    <BoardDashboard
                      diagramData={values}
                      readonly={false}
                      relatedObject={relatedObject}
                      relatedObjectType={entityType.relatedObjectType}
                      onUpdate={() => {
                        onDiagramUpdate()
                        setShowModal(false)
                      }}
                      setError={setError}
                      saveDisabled={!isValid}
                    />
                  </div>
                </>
              )
            }}
          </Formik>
        </Modal.Body>
      </Modal>
    </Fieldset>
  )
}

DiagramsContainer.propTypes = {
  diagrams: PropTypes.array,
  relatedObject: PropTypes.object,
  entityType: PropTypes.func,
  onDiagramUpdate: PropTypes.func
}

const Diagram = ({ diagramData, onSelect, relatedObject }) => {
  const [diagramHeight, setDiagramHeight] = useState(300)
  return (
    <div className="process-diagram" style={{ height: `${diagramHeight}px` }}>
      <div className="diagram-header">
        <legend>{diagramData.title}</legend>
        <Button variant="outline-secondary" onClick={onSelect}>
          Edit
        </Button>
      </div>
      <BoardDashboard
        diagramData={diagramData}
        readonly={true}
        relatedObject={relatedObject}
        diagramHeight={diagramHeight}
        setDiagramHeight={setDiagramHeight}
      />
    </div>
  )
}

Diagram.propTypes = {
  diagramData: PropTypes.object,
  onSelect: PropTypes.func,
  relatedObject: PropTypes.object
}

export default DiagramsContainer
