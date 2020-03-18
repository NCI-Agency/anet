import styled from "@emotion/styled"
import {
  AbstractModelFactory,
  AbstractReactFactory
} from "@projectstorm/react-canvas-core"
import {
  DefaultLinkModel,
  NodeModel,
  PortModel,
  PortModelAlignment,
  PortWidget
} from "@projectstorm/react-diagrams"
import * as React from "react"
import PropTypes from "prop-types"

export class DiagramPortModel extends PortModel {
  constructor(alignment) {
    super({
      type: "diamond",
      name: alignment,
      alignment: alignment
    })
  }

  createLinkModel = () => new DefaultLinkModel()
}

export class DiagramNodeModel extends NodeModel {
  constructor() {
    super({
      type: "diamond"
    })
    this.addPort(new DiagramPortModel(PortModelAlignment.TOP))
    this.addPort(new DiagramPortModel(PortModelAlignment.LEFT))
    this.addPort(new DiagramPortModel(PortModelAlignment.BOTTOM))
    this.addPort(new DiagramPortModel(PortModelAlignment.RIGHT))
  }
}

const Port = styled.div`
  width: 16px;
  height: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
`

export const DiagramNodeWidget = ({ size, node, engine }) => (
  <div
    className="diamond-node"
    style={{
      position: "relative",
      width: size,
      height: size
    }}
  >
    <svg
      width={size}
      height={size}
      dangerouslySetInnerHTML={{
        __html:
          `
          <g id="Layer_1">
          </g>
          <g id="Layer_2">
            <polygon fill="mediumpurple" stroke="${
              node.isSelected() ? "white" : "#000000"
            }" stroke-width="3" stroke-miterlimit="10" points="10,` +
          size / 2 +
          " " +
          size / 2 +
          ",10 " +
          (size - 10) +
          "," +
          size / 2 +
          " " +
          size / 2 +
          "," +
          (size - 10) +
          ` "/>
          </g>
        `
      }}
    />
    <PortWidget
      style={{
        top: size / 2 - 8,
        left: -8,
        position: "absolute"
      }}
      port={node.getPort(PortModelAlignment.LEFT)}
      engine={engine}
    >
      <Port />
    </PortWidget>
    <PortWidget
      style={{
        left: size / 2 - 8,
        top: -8,
        position: "absolute"
      }}
      port={node.getPort(PortModelAlignment.TOP)}
      engine={engine}
    >
      <Port />
    </PortWidget>
    <PortWidget
      style={{
        left: size - 8,
        top: size / 2 - 8,
        position: "absolute"
      }}
      port={node.getPort(PortModelAlignment.RIGHT)}
      engine={engine}
    >
      <Port />
    </PortWidget>
    <PortWidget
      style={{
        left: size / 2 - 8,
        top: size - 8,
        position: "absolute"
      }}
      port={node.getPort(PortModelAlignment.BOTTOM)}
      engine={engine}
    >
      <Port />
    </PortWidget>
  </div>
)

DiagramNodeWidget.propTypes = {
  size: PropTypes.number,
  node: PropTypes.object,
  engine: PropTypes.object
}

export class SimplePortFactory extends AbstractModelFactory {
  constructor(type, cb) {
    super(type)
    this.cb = cb
  }

  generateModel = event => this.cb(event.initialConfig)
}

export class DiagramNodeFactory extends AbstractReactFactory {
  constructor() {
    super("diamond")
  }

  generateReactWidget = event => {
    return (
      <DiagramNodeWidget engine={this.engine} size={50} node={event.model} />
    )
  }

  generateModel = event => new DiagramNodeModel()
}
