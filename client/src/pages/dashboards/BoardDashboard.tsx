import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import {
  CanvasWidget,
  DagreEngine,
  DefaultDiagramState,
  DefaultLabelFactory,
  DiagramEngine,
  DiagramModel,
  LinkLayerFactory,
  NodeLayerFactory,
  PathFindingLinkFactory,
  PortModelAlignment,
  SelectionBoxLayerFactory
} from "@projectstorm/react-diagrams"
import { DEFAULT_PAGE_PROPS } from "actions"
import MultiTypeAdvancedSelectComponent, {
  ALL_ENTITY_TYPES
} from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import FileSaver from "file-saver"
import * as Models from "models"
import React, { useEffect, useRef, useState } from "react"
import { Badge, Button, Card, Modal } from "react-bootstrap"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import DOWNLOAD_ICON from "resources/download.png"
import Settings from "settings"
import utils from "utils"
import "./BoardDashboard.css"
import {
  DiagramLinkFactory,
  DiagramNodeFactory,
  DiagramNodeModel,
  DiagramPortModel,
  SimplePortFactory
} from "./DiagramNode"

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

interface PrototypeNodeProps {
  name?: string
  model?: any
  onClick?: (...args: unknown[]) => unknown
}

const PrototypeNode = ({ name, model, onClick }: PrototypeNodeProps) => (
  <Badge style={{ margin: 10 }}>
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

interface BoardDashboardProps {
  pageDispatchers?: PageDispatchersPropType
}

const BoardDashboard = ({ pageDispatchers }: BoardDashboardProps) => {
  // Make sure we have a navigation menu
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    pageDispatchers
  })
  usePageTitle("Process Board")
  const { dashboard } = useParams()
  const dashboardSettings = Settings.dashboards.find(o => o.label === dashboard)
  const [dropEvent, setDropEvent] = useState(null)
  const engineRef = useRef(createEngine())
  const [model, setModel] = useState(null)
  const [edit, setEdit] = useState(false)
  const [selectingEntity, setSelectingEntity] = useState(false)
  const [editedNode, setEditedNode] = useState(null)
  const dagreEngineRef = useRef(
    new DagreEngine({
      graph: {
        rankdir: "RL",
        ranker: "longest-path",
        marginx: 25,
        marginy: 25
      },
      includeLinks: true
    })
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
    model && model.setLocked(!edit)
  }, [model, edit])

  useEffect(() => {
    fetch(dashboardSettings.data)
      .then(response => response.json())
      .then(data => {
        const model = new DiagramModel()
        model.deserializeModel(data, engineRef.current)
        setModel(model)
      })
      .catch(error =>
        console.error(
          "Error fetching",
          dashboardSettings.type,
          "dashboard",
          dashboardSettings.data,
          ":",
          error
        )
      )
  }, [dashboardSettings.data, dashboardSettings.type])

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
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%"
      }}
    >
      <div
        style={{
          position: "relative",
          flexGrow: 1
        }}
        onDrop={event => {
          event.persist()
          const data = utils.parseJsonSafe(
            event.dataTransfer.getData("storm-diagram-node")
          )
          const point = engineRef.current.getRelativeMousePoint(event)
          setDropEvent({ data, point })
        }}
        onDragOver={event => {
          event.preventDefault()
        }}
      >
        {engineRef.current.getModel() && (
          <CanvasWidget
            engine={engineRef.current}
            className="diagram-container"
          />
        )}
      </div>
      <div>
        <Card>
          <Button variant="primary" onClick={() => setEdit(!edit)}>
            {edit ? <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} /> : "Edit"}
          </Button>

          {edit && (
            <>
              <Button
                onClick={() => engineRef.current.zoomToFit()}
                variant="outline-secondary"
              >
                <Icon icon={IconNames.ZOOM_TO_FIT} />
              </Button>
              <Button
                onClick={() => {
                  dagreEngineRef.current.redistribute(model)
                  engineRef.current.repaintCanvas()
                }}
                variant="outline-secondary"
              >
                <Icon icon={IconNames.LAYOUT_AUTO} />
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
                <img src={DOWNLOAD_ICON} height={16} alt="Export json" />
              </Button>
            </>
          )}
        </Card>

        {edit && (
          <>
            <Card variant="primary">
              <Card.Header>Node palette</Card.Header>
              <Card.Body style={{ display: "flex", flexDirection: "column" }}>
                {Object.values(Models).map(Model => {
                  const instance = new Model()
                  const modelName = instance.constructor.resourceName
                  return (
                    instance.iconUrl && (
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
                    entityTypes={ALL_ENTITY_TYPES}
                  />
                </Modal.Body>
              </Modal>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(BoardDashboard)
