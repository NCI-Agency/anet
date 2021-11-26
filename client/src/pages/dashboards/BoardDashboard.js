import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import {
  CanvasWidget,
  SelectionBoxLayerFactory
} from "@projectstorm/react-canvas-core"
import {
  DefaultDiagramState,
  DiagramEngine,
  DiagramModel,
  LinkLayerFactory,
  NodeLayerFactory,
  PortModelAlignment
} from "@projectstorm/react-diagrams-core"
import { DefaultLabelFactory } from "@projectstorm/react-diagrams-defaults"
import { PathFindingLinkFactory } from "@projectstorm/react-diagrams-routing"
import API from "api"
import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import ConfirmDestructive from "components/ConfirmDestructive"
import LinkTo from "components/LinkTo"
import { GQL_CREATE_NOTE, GQL_UPDATE_NOTE, NOTE_TYPE } from "components/Model"
import FileSaver from "file-saver"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Badge, Button, Card, Modal } from "react-bootstrap"
import utils from "utils"
import "./BoardDashboard.css"
import {
  DiagramLinkFactory,
  DiagramNodeFactory,
  DiagramNodeModel,
  DiagramPortModel,
  SimplePortFactory
} from "./DiagramNode"

const GQL_DELETE_NOTE = gql`
  mutation($uuid: String!) {
    deleteNote(uuid: $uuid)
  }
`

const createEngine = options => {
  const engine = new DiagramEngine({})
  engine.getLayerFactories().registerFactory(new NodeLayerFactory())
  engine.getLayerFactories().registerFactory(new LinkLayerFactory())
  engine.getLayerFactories().registerFactory(new SelectionBoxLayerFactory())

  engine.getLabelFactories().registerFactory(new DefaultLabelFactory())
  engine.getNodeFactories().registerFactory(new DiagramNodeFactory())
  engine.getLinkFactories().registerFactory(new DiagramLinkFactory())
  engine.getLinkFactories().registerFactory(new PathFindingLinkFactory())
  engine
    .getPortFactories()
    .registerFactory(
      new SimplePortFactory(
        "anet",
        config => new DiagramPortModel(PortModelAlignment.LEFT)
      )
    )

  engine.getStateMachine().pushState(new DefaultDiagramState())
  return engine
}

const PrototypeNode = ({ name, model, onClick }) => (
  <Badge bg="secondary" style={{ marginBottom: "5px" }}>
    <div
      draggable
      onClick={onClick}
      onDragStart={event => {
        event.dataTransfer.setData(
          "storm-diagram-node",
          JSON.stringify({ anetObjectType: model.constructor.resourceName })
        )
      }}
      style={{ textAlign: "left", cursor: "grab" }}
    >
      <img
        src={model.iconUrl()}
        alt=""
        style={{
          marginLeft: 5,
          marginRight: 5,
          height: "2em",
          pointerEvents: "none"
        }}
      />
      {name}
    </div>
  </Badge>
)

PrototypeNode.propTypes = {
  name: PropTypes.string,
  model: PropTypes.object,
  onClick: PropTypes.func
}

const BoardDashboard = ({
  diagramNote,
  readonly,
  relatedObject,
  relatedObjectType,
  diagramHeight,
  setDiagramHeight,
  onUpdate
}) => {
  // Make sure we have a navigation menu

  const [dropEvent, setDropEvent] = useState(null)
  const engineRef = useRef(createEngine())
  const [model, setModel] = useState(null)
  const [selectingEntity, setSelectingEntity] = useState(false)
  const [editedNode, setEditedNode] = useState(null)
  const diagramModel = useMemo(
    () => (diagramNote ? utils.parseJsonSafe(diagramNote.text) : null),
    [diagramNote]
  )

  useEffect(() => {
    setModel(new DiagramModel())
    return () => setModel(null)
  }, [])

  useEffect(() => {
    const previousModel = engineRef.current.getModel()
    if (previousModel) {
      previousModel.clearListeners()
      previousModel.getNodes().forEach(node => node.clearListeners())
    }
    engineRef.current.setModel(model)
    if (model) {
      const selectionListener = {
        selectionChanged: () =>
          setEditedNode(
            model.getSelectedEntities().length === 1
              ? model.getSelectedEntities()[0]
              : null
          )
      }
      model.registerListener({
        nodesUpdated: function(event) {
          if (event.isCreated) {
            event.node.registerListener(selectionListener)
          } else {
            if (
              editedNode?.options.anetObject.uuid ===
              event.node.anetObject?.uuid
            ) {
              setEditedNode(null)
            }
          }
        }
      })
      model.getNodes().forEach(node => node.registerListener(selectionListener))
    }
  }, [editedNode, model])

  useEffect(() => {
    model && model.setLocked(readonly)
  }, [model, readonly])

  useEffect(() => {
    if (diagramModel) {
      const model = new DiagramModel()
      model.deserializeModel(diagramModel, engineRef.current)
      setModel(model)
      engineRef.current.setModel(model)
    }
  }, [diagramModel])

  useEffect(() => {
    if (dropEvent) {
      const { data, point } = dropEvent
      const node = new DiagramNodeModel(data)

      node.setPosition(point)
      model.getSelectedEntities().forEach(entity => entity.setSelected(false))
      node.setSelected(true)
      setEditedNode(node)
      engineRef.current.getModel().addNode(node)
      setDropEvent(null)
    }
  }, [model, dropEvent])

  return (
    <div className="diagram-editor">
      <div className="diagram-control-panel">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {readonly && (
            <Button
              onClick={() => setDiagramHeight(diagramHeight + 50)}
              variant="outline-secondary"
            >
              <Icon icon={IconNames.EXPAND_ALL} />
            </Button>
          )}
          {readonly && (
            <Button
              onClick={() => setDiagramHeight(diagramHeight - 50)}
              variant="outline-secondary"
            >
              <Icon icon={IconNames.COLLAPSE_ALL} />
            </Button>
          )}
          <Button
            onClick={() => engineRef.current.zoomToFit()}
            variant="outline-secondary"
          >
            <Icon icon={IconNames.ZOOM_TO_FIT} />
          </Button>
          <Button
            onClick={() => {
              const blob = new Blob([JSON.stringify(model.serialize())], {
                type: "application/json;charset=utf-8"
              })
              FileSaver.saveAs(blob, "BoardDashboard.json")
            }}
            variant="outline-secondary"
          >
            <Icon icon={IconNames.IMPORT} />
          </Button>
        </div>
        {!readonly && (
          <>
            <Card variant="primary">
              <Card.Header>Node palette</Card.Header>
              <Card.Body style={{ display: "flex", flexDirection: "column" }}>
                {Object.values(Models).map(Model => {
                  const instance = new Model()
                  const modelName = instance.constructor.resourceName
                  return (
                    instance.iconUrl() && (
                      <PrototypeNode
                        key={`palette-${modelName}`}
                        model={instance}
                        name={modelName}
                        onClick={event => {
                          const data = { anetObjectType: modelName }
                          const point = { x: 150, y: 150 }
                          setDropEvent({ data, point })
                        }}
                      />
                    )
                  )
                })}
                <span>
                  <i>Click or drag into diagram</i>
                </span>
              </Card.Body>
            </Card>
            <Card variant="primary">
              <Card.Header>Node editor</Card.Header>
              <Card.Body>
                {editedNode ? (
                  <>
                    <span>ANET entity:</span>
                    <br />
                    <Button
                      onClick={() => setSelectingEntity(true)}
                      variant="outline-secondary"
                    >
                      <LinkTo
                        modelType={editedNode.options.anetObjectType}
                        model={editedNode.options.anetObject}
                        isLink={false}
                      />
                    </Button>
                  </>
                ) : (
                  <span>
                    <i>Select an item on diagram</i>
                  </span>
                )}
              </Card.Body>
              <Modal
                centered
                show={selectingEntity}
                onHide={() => setSelectingEntity(false)}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Edit diagram node</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <MultiTypeAdvancedSelectComponent
                    onConfirm={(value, objectType) => {
                      editedNode.options.anetObject = value
                      editedNode.options.anetObjectType = objectType
                      setSelectingEntity(false)
                    }}
                    objectType={editedNode?.options.anetObjectType}
                  />
                </Modal.Body>
              </Modal>
            </Card>
          </>
        )}
        {!readonly && (
          <>
            <Button
              onClick={() =>
                onSaveDiagram(
                  model,
                  relatedObject?.uuid,
                  diagramNote?.uuid,
                  onUpdate,
                  relatedObjectType
                )
              }
            >
              Save
            </Button>
            {diagramNote?.uuid && (
              <ConfirmDestructive
                variant="danger"
                objectType="diagram"
                objectDisplay={diagramNote.uuid}
                onConfirm={() => onDeleteDiagram(diagramNote.uuid, onUpdate)}
              >
                <Icon icon={IconNames.TRASH} />
              </ConfirmDestructive>
            )}
          </>
        )}
        <Modal
          centered
          show={selectingEntity}
          onHide={() => setSelectingEntity(false)}
          style={{ zIndex: "1400" }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit diagram node</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <MultiTypeAdvancedSelectComponent
              onConfirm={(value, objectType) => {
                editedNode.options.anetObject = value
                editedNode.options.anetObjectType = objectType
                setSelectingEntity(false)
              }}
              objectType={editedNode?.options.anetObjectType}
            />
          </Modal.Body>
        </Modal>
      </div>
      <div
        className="diagram-container"
        onDrop={event => {
          if (!readonly) {
            event.persist()
            const data = utils.parseJsonSafe(
              event.dataTransfer.getData("storm-diagram-node")
            )
            const point = engineRef.current.getRelativeMousePoint(event)
            setDropEvent({ data, point })
          }
        }}
        onDragOver={event => {
          event.preventDefault()
        }}
      >
        {engineRef.current.getModel() && (
          <CanvasWidget engine={engineRef.current} className="canvas-widget" />
        )}
      </div>
    </div>
  )
}

BoardDashboard.propTypes = {
  diagramNote: PropTypes.object,
  readonly: PropTypes.bool,
  relatedObject: PropTypes.object,
  relatedObjectType: PropTypes.string,
  diagramHeight: PropTypes.number,
  setDiagramHeight: PropTypes.func,
  onUpdate: PropTypes.func
}

const onSaveDiagram = (
  diagramData,
  relatedObjectUuid,
  noteUuid,
  onSuccess,
  relatedObjectType
) => {
  return saveDiagram(
    diagramData,
    relatedObjectUuid,
    relatedObjectType,
    noteUuid
  )
    .then(response => {
      onSuccess()
    })
    .catch(error => console.log("error: ", error))
}

const saveDiagram = (
  diagramData,
  relatedObjectUuid,
  relatedObjectType,
  noteUuid
) => {
  const serializedData = JSON.stringify(diagramData.serialize())
  const updatedNote = {
    uuid: noteUuid,
    type: NOTE_TYPE.DIAGRAM,
    text: serializedData,
    noteRelatedObjects: [
      {
        relatedObjectType: relatedObjectType,
        relatedObjectUuid: relatedObjectUuid
      }
    ]
  }
  return API.mutation(noteUuid ? GQL_UPDATE_NOTE : GQL_CREATE_NOTE, {
    note: updatedNote
  })
}

const onDeleteDiagram = (uuid, onSuccess) => {
  return deleteDiagram(uuid)
    .then(response => {
      onSuccess()
    })
    .catch(error => console.log("delete error: ", error))
}

const deleteDiagram = uuid => {
  return API.mutation(GQL_DELETE_NOTE, { uuid })
}

export default BoardDashboard
