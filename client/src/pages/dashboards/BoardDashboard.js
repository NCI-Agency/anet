import { CanvasWidget } from "@projectstorm/react-canvas-core"
import * as Models from "models"
import createEngine, {
  DiagramModel,
  PortModelAlignment
} from "@projectstorm/react-diagrams"
import { Settings } from "api"
import { mapPageDispatchersToProps } from "components/Page"
import FileSaver from "file-saver"
import PropTypes from "prop-types"
import React, { useEffect, useState, useRef } from "react"
import { Badge, Button } from "react-bootstrap"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import DOWNLOAD_ICON from "resources/download.png"
import {
  DiagramNodeModel,
  DiagramNodeFactory,
  SimplePortFactory,
  DiagramPortModel
} from "./DiagramNode"
import "./BoardDashboard.css"

const PrototypeNode = ({ name, model }) => (
  <Badge style={{ margin: 10, background: "white", color: "#106ba3" }}>
    <div
      draggable
      onDragStart={event => {
        event.dataTransfer.setData("storm-diagram-node", JSON.stringify(model))
      }}
    >
      <img
        src={model.iconUrl()}
        alt=""
        style={{ marginLeft: 5, marginRight: 5, height: "1em" }}
      />
      {name}
    </div>
  </Badge>
)

function bootstrapEngine() {
  const engine = createEngine()
  engine
    .getPortFactories()
    .registerFactory(
      new SimplePortFactory(
        "diamond",
        config => new DiagramPortModel(PortModelAlignment.LEFT)
      )
    )
  engine.getNodeFactories().registerFactory(new DiagramNodeFactory())
  return engine
}

PrototypeNode.propTypes = {
  name: PropTypes.string,
  model: PropTypes.object
}

const BoardDashboard = () => {
  const { dashboard } = useParams()
  const dashboardSettings = Settings.dashboards.find(o => o.label === dashboard)
  const [dropEvent, setDropEvent] = useState()
  const engineRef = useRef(bootstrapEngine())
  const [model, setModel] = useState()
  const [edit, setEdit] = useState(false)

  useEffect(() => {
    setModel(new DiagramModel())
  }, [])

  useEffect(() => {
    engineRef.current.setModel(model)
  }, [model])

  useEffect(() => {
    model && model.setLocked(!edit)
  }, [model, edit])

  useEffect(() => {
    async function fetchData() {
      await fetch(dashboardSettings.data)
        .then(response => response.json())
        .then(data => {
          const model = new DiagramModel()
          model.deserializeModel(data, engineRef.current)
          setModel(model)
        })
    }
    fetchData()
  }, [dashboardSettings.data])

  useEffect(() => {
    if (dropEvent) {
      const data = JSON.parse(
        dropEvent.dataTransfer.getData("storm-diagram-node")
      )
      console.log(data)
      const node = new DiagramNodeModel()
      const point = engineRef.current.getRelativeMousePoint(dropEvent)
      node.setPosition(point)
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
          setDropEvent(event)
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
      <div style={{ flexGrow: 0, display: "flex", flexDirection: "column" }}>
        <Button onClick={() => setEdit(!edit)}>{edit ? "View" : "Edit"}</Button>

        {edit && (
          <>
            <PrototypeNode model={new Models.Task()} name="Task" />
            <PrototypeNode model={new Models.Position()} name="Position" />
            <PrototypeNode model={new Models.Person()} name="Person" />
            <PrototypeNode
              model={new Models.Organization()}
              name="Organization"
            />
            <PrototypeNode model={new Models.Location()} name="Location" />
            <Button
              onClick={() => {
                const blob = new Blob([JSON.stringify(model.serialize())], {
                  type: "application/json;charset=utf-8"
                })
                FileSaver.saveAs(blob, "BoardDashboard.json")
              }}
            >
              <img src={DOWNLOAD_ICON} height={16} alt="Export json" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(BoardDashboard)
