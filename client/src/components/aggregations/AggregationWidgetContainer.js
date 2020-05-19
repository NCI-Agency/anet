import {
  DefaultAggWidget,
  PieWidget,
  ReportsByTaskWidget
} from "components/aggregations/AggregationWidgets"
import { getFieldPropsFromFieldConfig } from "components/CustomFields"
import IqrBoxPlot from "components/graphs/IqrBoxPlot"
import LikertScale from "components/graphs/LikertScale"
import { CUSTOM_FIELD_TYPE } from "components/Model"
import PropTypes from "prop-types"
import React from "react"
import { Col, ControlLabel, FormGroup } from "react-bootstrap"

const AGGERGATION_WIDGET_TYPE = {
  LIKERT_SCALE: "likertScale",
  PIE: "pie",
  REPORTS_BY_TASK: "reportsByTask",
  IQR_BOX_PLOT: "iqrBoxPlot",
  DEFAULT: "default"
}

const DEFAULT_AGGREGATION_WIDGET_PER_FIELD_TYPE = {
  [CUSTOM_FIELD_TYPE.TEXT]: AGGERGATION_WIDGET_TYPE.DEFAULT,
  [CUSTOM_FIELD_TYPE.NUMBER]: AGGERGATION_WIDGET_TYPE.IQR_BOX_PLOT,
  [CUSTOM_FIELD_TYPE.DATE]: AGGERGATION_WIDGET_TYPE.DEFAULT,
  [CUSTOM_FIELD_TYPE.DATETIME]: AGGERGATION_WIDGET_TYPE.DEFAULT,
  [CUSTOM_FIELD_TYPE.ENUM]: AGGERGATION_WIDGET_TYPE.PIE,
  [CUSTOM_FIELD_TYPE.ENUMSET]: AGGERGATION_WIDGET_TYPE.PIE,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: AGGERGATION_WIDGET_TYPE.DEFAULT,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: AGGERGATION_WIDGET_TYPE.DEFAULT
}

const WIDGET_COMPONENTS = {
  [AGGERGATION_WIDGET_TYPE.LIKERT_SCALE]: LikertScale,
  [AGGERGATION_WIDGET_TYPE.PIE]: PieWidget,
  [AGGERGATION_WIDGET_TYPE.IQR_BOX_PLOT]: IqrBoxPlot,
  [AGGERGATION_WIDGET_TYPE.REPORTS_BY_TASK]: ReportsByTaskWidget,
  [AGGERGATION_WIDGET_TYPE.COUNT_PER_VALUE]: PieWidget,
  default: DefaultAggWidget
}

const AggregationWidgetContainer = ({
  fieldConfig,
  values,
  vertical,
  ...otherWidgetProps
}) => {
  const aggregationType = fieldConfig.aggregation?.aggregationType
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  const label = fieldProps.label
  const widget =
    fieldConfig.aggregation?.widget ||
    (fieldConfig.widget &&
      WIDGET_COMPONENTS[fieldConfig.widget] &&
      fieldConfig.widget) ||
    DEFAULT_AGGREGATION_WIDGET_PER_FIELD_TYPE[fieldConfig.type]
  const WidgetComponent =
    (widget && WIDGET_COMPONENTS[widget]) || WIDGET_COMPONENTS.default
  const widgetElem = (
    <WidgetComponent
      values={values}
      aggregationType={aggregationType}
      vertical={vertical}
      {...fieldProps}
      {...otherWidgetProps}
    />
  )
  return (
    <FormGroup>
      {vertical ? (
        <>
          {label !== null && <ControlLabel>{label}</ControlLabel>}
          {widgetElem}
        </>
      ) : (
        <>
          {label !== null && (
            <Col sm={2} componentClass={ControlLabel}>
              {label}
            </Col>
          )}
          <Col sm={10}>
            <div>{widgetElem}</div>
          </Col>
        </>
      )}
    </FormGroup>
  )
}
AggregationWidgetContainer.propTypes = {
  values: PropTypes.any,
  fieldConfig: PropTypes.object,
  vertical: PropTypes.bool
}
AggregationWidgetContainer.defaultProps = {
  vertical: true
}

export default AggregationWidgetContainer
