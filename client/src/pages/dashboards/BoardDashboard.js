import { CanvasWidget } from "@projectstorm/react-canvas-core"
import createEngine, {
  DefaultNodeModel,
  DiagramModel
} from "@projectstorm/react-diagrams"
import { Settings } from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import FileSaver from "file-saver"
import _keys from "lodash/keys"
import PropTypes from "prop-types"
import React, { useEffect, useState, useRef } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import DOWNLOAD_ICON from "resources/download.png"
import "./BoardDashboard.css"

const PrototypeNode = ({ name, model }) => (
  <div
    style={{
      color: "red"
    }}
    draggable
    onDragStart={event => {
      event.dataTransfer.setData("storm-diagram-node", JSON.stringify(model))
    }}
  >
    {name}
  </div>
)

PrototypeNode.propTypes = {
  name: PropTypes.string,
  model: PropTypes.object
}

const BoardDashboard = ({ pageDispatchers }) => {
  const { dashboard } = useParams()
  const dashboardSettings = Settings.dashboards.find(o => o.label === dashboard)
  const [dropEvent, setDropEvent] = useState()
  const engineRef = useRef(createEngine())
  const [model, setModel] = useState()

  useEffect(() => {
    setModel(new DiagramModel())
  }, [])

  useEffect(() => {
    engineRef.current.setModel(model)
  }, [model])

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
      const nodesCount = _keys(model.getNodes()).length

      let node = null
      if (data.type === "in") {
        node = new DefaultNodeModel(
          "Node " + (nodesCount + 1),
          "rgb(192,255,0)"
        )
        node.addInPort("In")
      } else {
        node = new DefaultNodeModel(
          "Node " + (nodesCount + 1),
          "rgb(0,192,255)"
        )
        node.addOutPort("Out")
      }
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
      <div style={{ flexGrow: 0 }}>
        <PrototypeNode model={{ type: "in" }} name="In Node" />
        <PrototypeNode model={{ type: "out" }} name="Out Node" />
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
      </div>
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
    </div>
  )
}

BoardDashboard.propTypes = { pageDispatchers: PageDispatchersPropType }

export default connect(null, mapPageDispatchersToProps)(BoardDashboard)
