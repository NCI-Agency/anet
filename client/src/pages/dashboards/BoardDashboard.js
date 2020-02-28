import { CanvasWidget } from "@projectstorm/react-canvas-core"
import createEngine, {
  DefaultNodeModel,
  DiagramModel
} from "@projectstorm/react-diagrams"
import "./BoardDashboard.css"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import React from "react"
import { connect } from "react-redux"

const BoardDashboard = ({ pageDispatchers }) => {
  const engine = createEngine()

  const node1 = new DefaultNodeModel({
    name: "Node 1",
    color: "rgb(0,192,255)"
  })

  node1.setPosition(100, 100)
  const port1 = node1.addOutPort("Out")

  const node2 = new DefaultNodeModel({
    name: "Node 1",
    color: "rgb(0,192,255)"
  })

  node2.setPosition(100, 100)
  const port2 = node2.addOutPort("Out")

  const link = port1.link(port2)

  const model = new DiagramModel()
  model.addAll(node1, node2, link)
  engine.setModel(model)

  return <CanvasWidget engine={engine} className="diagram-container" />
}

BoardDashboard.propTypes = { pageDispatchers: PageDispatchersPropType }

export default connect(null, mapPageDispatchersToProps)(BoardDashboard)
