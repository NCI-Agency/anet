import { css, keyframes } from "@emotion/core"
import styled from "@emotion/styled"
import {
  AbstractModelFactory,
  AbstractReactFactory
} from "@projectstorm/react-canvas-core"
import {
  NodeModel,
  PortModel,
  PortModelAlignment,
  PortWidget
} from "@projectstorm/react-diagrams-core"
import {
  DefaultLinkFactory,
  DefaultLinkModel,
  DefaultLinkWidget
} from "@projectstorm/react-diagrams-defaults"
import LinkTo from "components/LinkTo"
import * as Models from "models"
import PropTypes from "prop-types"
import * as React from "react"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"

const ENTITY_GQL_FIELDS = {
  Report: "uuid, intent",
  Person: "uuid, name, role, avatar(size: 64)",
  Organization: "uuid, shortName",
  Position: "uuid, name",
  Location: "uuid, name",
  Task: "uuid, shortName, longName"
}

export class DiagramPortModel extends PortModel {
  constructor(alignment) {
    super({
      type: "anet",
      name: alignment,
      alignment: alignment
    })
  }

  createLinkModel = () => new DiagramLinkModel()
}

export class DiagramLinkModel extends DefaultLinkModel {
  constructor() {
    super({
      type: "anet"
    })
  }
}
export class DiagramNodeModel extends NodeModel {
  constructor(options) {
    super({
      type: "anet",
      ...options
    })
    this.addPort(new DiagramPortModel(PortModelAlignment.TOP))
    this.addPort(new DiagramPortModel(PortModelAlignment.LEFT))
    this.addPort(new DiagramPortModel(PortModelAlignment.BOTTOM))
    this.addPort(new DiagramPortModel(PortModelAlignment.RIGHT))
  }

  deserialize = event => {
    super.deserialize(event)
    const options = this.options
    options.anetObjectType = event.data.anetObjectType
    options.color = event.data.color
    // TODO: batch-process all queries as one
    const modelClass = Models[event.data.anetObjectType]
    modelClass &&
      modelClass
        .fetchByUuid(event.data.anetObjectUuid, ENTITY_GQL_FIELDS)
        .then(function(entity) {
          options.anetObject = entity
          // TODO: fire an event instead
          event.engine.repaintCanvas()
        })
  }

  serialize = () => ({
    ...super.serialize(),
    anetObjectUuid: this.options.anetObject?.uuid,
    anetObjectType: this.options.anetObjectType,
    color: this.options.color
  })
}

const Port = styled.div`
  width: 16px;
  height: 16px;
  z-index: 10;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
`

export const DiagramNodeWidget = ({ size, node, engine }) => {
  const ModelClass =
    node.options.anetObjectType && Models[node.options.anetObjectType]

  const modelInstance = ModelClass && new ModelClass(node.options.anetObject)
  return (
    <div
      className="diagram-node"
      style={{
        position: "relative",
        width: size,
        height: size,
        backgroundColor: node.isSelected() ? "rgba(0, 0, 255, 0.3)" : "white"
      }}
    >
      {modelInstance &&
      Object.prototype.hasOwnProperty.call(modelInstance, "avatar") ? (
        <AvatarDisplayComponent
          avatar={modelInstance.avatar}
          height={64}
          width={64}
          style={{ pointerEvents: "none" }}
        />
        ) : (
          <img
            src={modelInstance?.iconUrl()}
            alt=""
            width={48}
            height={48}
            style={{ marginLeft: 8, marginTop: 8, pointerEvents: "none" }}
          />
        )}
      {node.options.anetObjectType && node.options.anetObject && (
        <div style={{ paddingTop: 5 }}>
          <LinkTo
            modelType={node.options.anetObjectType}
            model={node.options.anetObject}
            showAvatar={false}
            showIcon={false}
          />
        </div>
      )}
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
}

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

export const Keyframes = keyframes`
from {
  stroke-dashoffset: 24;
}
to {
  stroke-dashoffset: 0;
}
`

const selected = css`
  stroke-dasharray: 10, 2;
  animation: ${Keyframes} 1s linear infinite;
`

export const Path = styled.path`
  ${p => p.selected && selected};
  fill: none;
  pointer-events: all;
`

export class DiagramLinkFactory extends DefaultLinkFactory {
  constructor() {
    super("anet")
  }

  generateReactWidget(event) {
    return <DefaultLinkWidget link={event.model} diagramEngine={this.engine} />
  }

  generateModel() {
    return new DiagramLinkModel()
  }

  generateLinkSegment(model, selected, path) {
    return (
      <Path
        selected={selected}
        stroke={
          selected ? model.getOptions().selectedColor : model.getOptions().color
        }
        strokeWidth={model.getOptions().width}
        d={path}
      />
    )
  }
}

export class DiagramNodeFactory extends AbstractReactFactory {
  constructor() {
    super("anet")
  }

  generateReactWidget = event => {
    return (
      <DiagramNodeWidget engine={this.engine} size={64} node={event.model} />
    )
  }

  generateModel = event => new DiagramNodeModel()
}
