import { css, keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import {
  AbstractModelFactory,
  AbstractReactFactory,
  DefaultLinkFactory,
  DefaultLinkModel,
  DefaultLinkWidget,
  NodeModel,
  PortModel,
  PortModelAlignment,
  PortWidget
} from "@projectstorm/react-diagrams"
import AggregationWidgetContainer, {
  AGGREGATION_WIDGET_TYPE,
  getAggregationWidget
} from "components/aggregations/AggregationWidgetContainer"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import { SPECIAL_WIDGET_TYPES } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import { CUSTOM_FIELD_TYPE, GRAPHQL_ENTITY_FIELDS } from "components/Model"
import { GRAPHQL_NOTES_FIELDS } from "components/RelatedObjectNotes"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import moment from "moment"
import { PERIOD_FACTORIES, RECURRENCE_TYPE } from "periodUtils"
import * as React from "react"

const ENTITY_GQL_FIELDS = {
  Report: GRAPHQL_ENTITY_FIELDS.Report,
  Person: `${GRAPHQL_ENTITY_FIELDS.Person} ${GRAPHQL_NOTES_FIELDS}`,
  Organization: GRAPHQL_ENTITY_FIELDS.Organization,
  Position: GRAPHQL_ENTITY_FIELDS.Position,
  Location: GRAPHQL_ENTITY_FIELDS.Location,
  Task: `${GRAPHQL_ENTITY_FIELDS.Task} ${GRAPHQL_NOTES_FIELDS}`
}

const DIAGRAM_AGGREGATION_WIDGET_PER_FIELD_TYPE = {
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: {
    [SPECIAL_WIDGET_TYPES.LIKERT_SCALE]: AGGREGATION_WIDGET_TYPE.PIE
  }
}

export class DiagramPortModel extends PortModel {
  constructor(alignment) {
    super({
      type: "anet",
      name: alignment,
      alignment
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
        .catch(error =>
          console.error(
            "Error fetching",
            event.data.anetObjectType,
            "with uuid",
            event.data.anetObjectUuid,
            ":",
            error
          )
        )
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

interface DiagramNodeWidgetProps {
  size?: number
  node?: any
  engine?: any
}

export const DiagramNodeWidget = ({
  size,
  node,
  engine
}: DiagramNodeWidgetProps) => {
  const { anetObjectType, anetObject } = node.options
  const ModelClass = anetObjectType && Models[anetObjectType]
  const modelInstance = anetObject && ModelClass && new ModelClass(anetObject)
  const now = moment()
  // TODO: in principle, there can be more than one assessment definition for each recurrence,
  // so we should distinguish them here by key when we add that to the database.
  const period = PERIOD_FACTORIES[RECURRENCE_TYPE.MONTHLY](now, 0)
  const instantAssessmentConfig =
    anetObject && anetObject.getInstantAssessmentConfig()
  const instantAssessmentResults =
    !_isEmpty(instantAssessmentConfig) &&
    anetObject.getInstantAssessmentResults(period)
  return (
    <div
      className="diagram-node"
      style={{
        position: "relative",
        width: size,
        height: size,
        backgroundColor: node.isSelected() ? "rgba(0, 0, 255, 0.3)" : null
      }}
    >
      {modelInstance && Object.hasOwn(modelInstance, "entityAvatar") ? (
        <EntityAvatarDisplay
          avatar={modelInstance.entityAvatar}
          defaultAvatar={ModelClass.relatedObjectType}
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
      {anetObjectType && anetObject && (
        <div style={{ paddingTop: 5 }}>
          <LinkTo
            modelType={anetObjectType}
            model={anetObject}
            showAvatar={false}
            showIcon={false}
          />
          <>
            {instantAssessmentConfig &&
              Object.entries(instantAssessmentConfig.questions || {}).map(
                ([questionKey, questionConfig]) => {
                  const aggregationWidget = getAggregationWidget(
                    questionConfig,
                    DIAGRAM_AGGREGATION_WIDGET_PER_FIELD_TYPE,
                    true
                  )
                  questionConfig.showLegend = false
                  return aggregationWidget ? (
                    <AggregationWidgetContainer
                      key={`assessment-${questionKey}`}
                      fieldConfig={questionConfig}
                      fieldName={questionKey}
                      data={instantAssessmentResults}
                      widget={aggregationWidget}
                      widgetId={`${questionKey}-assessment`}
                    />
                  ) : null
                }
              )}
          </>
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
