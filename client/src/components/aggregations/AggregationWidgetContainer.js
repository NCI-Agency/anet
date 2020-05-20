import {
  CalendarWidget,
  DefaultAggWidget,
  LikertScaleAndPieWidget,
  PieWidget,
  ReportsByTaskWidget
} from "components/aggregations/AggregationWidgets"
import { getAggregationFunctionForFieldConfig } from "components/aggregations/utils"
import {
  getFieldPropsFromFieldConfig,
  SPECIAL_WIDGET_TYPES
} from "components/CustomFields"
import IqrBoxPlot from "components/graphs/IqrBoxPlot"
import LikertScale from "components/graphs/LikertScale"
import { CUSTOM_FIELD_TYPE } from "components/Model"
import PropTypes from "prop-types"
import React from "react"
import { Col, ControlLabel, FormGroup } from "react-bootstrap"

const AGGERGATION_WIDGET_TYPE = {
  LIKERT_SCALE: "likertScale",
  PIE: "pie",
  LIKERT_SCALE_AND_PIE: "likertScaleAndPie",
  REPORTS_BY_TASK: "reportsByTask",
  IQR_BOX_PLOT: "iqrBoxPlot",
  CALENDAR: "calendar",
  DEFAULT: "default"
}

const DEFAULT_AGGREGATION_WIDGET_PER_FIELD_TYPE = {
  [CUSTOM_FIELD_TYPE.TEXT]: AGGERGATION_WIDGET_TYPE.DEFAULT,
  [CUSTOM_FIELD_TYPE.NUMBER]: AGGERGATION_WIDGET_TYPE.IQR_BOX_PLOT,
  [CUSTOM_FIELD_TYPE.DATE]: AGGERGATION_WIDGET_TYPE.CALENDAR,
  [CUSTOM_FIELD_TYPE.DATETIME]: AGGERGATION_WIDGET_TYPE.CALENDAR,
  [CUSTOM_FIELD_TYPE.ENUM]: AGGERGATION_WIDGET_TYPE.PIE,
  [CUSTOM_FIELD_TYPE.ENUMSET]: AGGERGATION_WIDGET_TYPE.PIE,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: AGGERGATION_WIDGET_TYPE.DEFAULT,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: {
    [SPECIAL_WIDGET_TYPES.LIKERT_SCALE]:
      AGGERGATION_WIDGET_TYPE.LIKERT_SCALE_AND_PIE
  }
}

const WIDGET_COMPONENTS = {
  [AGGERGATION_WIDGET_TYPE.LIKERT_SCALE]: LikertScale,
  [AGGERGATION_WIDGET_TYPE.PIE]: PieWidget,
  [AGGERGATION_WIDGET_TYPE.LIKERT_SCALE_AND_PIE]: LikertScaleAndPieWidget,
  [AGGERGATION_WIDGET_TYPE.IQR_BOX_PLOT]: IqrBoxPlot,
  [AGGERGATION_WIDGET_TYPE.REPORTS_BY_TASK]: ReportsByTaskWidget,
  [AGGERGATION_WIDGET_TYPE.COUNT_PER_VALUE]: PieWidget,
  [AGGERGATION_WIDGET_TYPE.CALENDAR]: CalendarWidget,
  default: DefaultAggWidget
}

const AggregationWidgetContainer = ({
  data,
  fieldConfig,
  fieldName,
  vertical,
  ...otherWidgetProps
}) => {
  const aggregationFunction = getAggregationFunctionForFieldConfig(fieldConfig)
  const { values, ...otherAggregationDetails } = aggregationFunction(
    fieldName,
    fieldConfig,
    data
  )

  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  const label = fieldProps.label

  const widget =
    fieldConfig.aggregation?.widget ||
    DEFAULT_AGGREGATION_WIDGET_PER_FIELD_TYPE[fieldConfig.type][
      fieldConfig.widget
    ] ||
    DEFAULT_AGGREGATION_WIDGET_PER_FIELD_TYPE[fieldConfig.type]
  const WidgetComponent =
    (widget && WIDGET_COMPONENTS[widget]) || WIDGET_COMPONENTS.default
  const widgetElem = (
    <WidgetComponent
      values={values}
      vertical={vertical}
      fieldConfig={fieldConfig}
      fieldName={fieldName}
      {...fieldProps}
      {...otherWidgetProps}
      {...otherAggregationDetails}
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
  data: PropTypes.any,
  fieldConfig: PropTypes.object,
  fieldName: PropTypes.string,
  vertical: PropTypes.bool
}
AggregationWidgetContainer.defaultProps = {
  vertical: true
}

export default AggregationWidgetContainer
