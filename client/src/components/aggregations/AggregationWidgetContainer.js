import {
  countPerDateAggregation,
  countPerValueAggregation,
  likertScaleAndPieAggregation,
  numbersListAggregation,
  reportsByTaskAggregation,
  valuesListAggregation
} from "components/aggregations/utils"
import {
  CalendarWidget,
  DefaultAggWidget,
  LikertScaleAndPieWidget,
  PieWidget,
  ReportsByTaskWidget
} from "components/aggregations/AggregationWidgets"
import {
  getFieldPropsFromFieldConfig,
  SPECIAL_WIDGET_TYPES
} from "components/CustomFields"
import IqrBoxPlot from "components/graphs/IqrBoxPlot"
import LikertScale from "components/graphs/LikertScale"
import { CUSTOM_FIELD_TYPE } from "components/Model"
import { AssessmentPeriodPropType, PeriodPropType } from "periodUtils"
import PropTypes from "prop-types"
import React from "react"
import { Col, ControlLabel, FormGroup } from "react-bootstrap"
import utils from "utils"

export const AGGERGATION_WIDGET_TYPE = {
  LIKERT_SCALE: "likertScale",
  PIE: "pie",
  LIKERT_SCALE_AND_PIE: "likertScaleAndPie",
  REPORTS_BY_TASK: "reportsByTask",
  IQR_BOX_PLOT: "iqrBoxPlot",
  CALENDAR: "calendar",
  DEFAULT: "default"
}

const AGGREGATION_WIDGET_COMPONENTS = {
  [AGGERGATION_WIDGET_TYPE.LIKERT_SCALE]: LikertScale,
  [AGGERGATION_WIDGET_TYPE.PIE]: PieWidget,
  [AGGERGATION_WIDGET_TYPE.LIKERT_SCALE_AND_PIE]: LikertScaleAndPieWidget,
  [AGGERGATION_WIDGET_TYPE.IQR_BOX_PLOT]: IqrBoxPlot,
  [AGGERGATION_WIDGET_TYPE.REPORTS_BY_TASK]: ReportsByTaskWidget,
  [AGGERGATION_WIDGET_TYPE.CALENDAR]: CalendarWidget,
  [AGGERGATION_WIDGET_TYPE.DEFAULT]: DefaultAggWidget
}

const DEFAULT_AGGREGATION_WIDGET_PER_FIELD_TYPE = {
  [CUSTOM_FIELD_TYPE.TEXT]: AGGERGATION_WIDGET_TYPE.DEFAULT,
  [CUSTOM_FIELD_TYPE.NUMBER]: AGGERGATION_WIDGET_TYPE.IQR_BOX_PLOT,
  [CUSTOM_FIELD_TYPE.DATE]: AGGERGATION_WIDGET_TYPE.CALENDAR,
  [CUSTOM_FIELD_TYPE.DATETIME]: AGGERGATION_WIDGET_TYPE.CALENDAR,
  [CUSTOM_FIELD_TYPE.ENUM]: AGGERGATION_WIDGET_TYPE.PIE,
  [CUSTOM_FIELD_TYPE.ENUMSET]: AGGERGATION_WIDGET_TYPE.PIE,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: {
    [SPECIAL_WIDGET_TYPES.LIKERT_SCALE]:
      AGGERGATION_WIDGET_TYPE.LIKERT_SCALE_AND_PIE,
    [SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR]: AGGERGATION_WIDGET_TYPE.DEFAULT
  }
}

const AGGREGATION_TYPE = {
  REPORTS_BY_TASK: "countReportsByTask",
  COUNT_PER_DATE: "countPerDate",
  COUNT_PER_VALUE: "countPerValue",
  NUMBERS_LIST: "numbersList",
  VALUES_LIST: "valuesList",
  LIKERT_SCALE_AND_PIE_AGG: "likertScaleAndPieAgg"
}

const DEFAULT_AGGREGATION_TYPE_PER_WIDGET_TYPE = {
  [AGGERGATION_WIDGET_TYPE.LIKERT_SCALE]: AGGREGATION_TYPE.VALUES_LIST,
  [AGGERGATION_WIDGET_TYPE.PIE]: AGGREGATION_TYPE.COUNT_PER_VALUE,
  [AGGERGATION_WIDGET_TYPE.LIKERT_SCALE_AND_PIE]:
    AGGREGATION_TYPE.LIKERT_SCALE_AND_PIE_AGG,
  [AGGERGATION_WIDGET_TYPE.REPORTS_BY_TASK]: AGGREGATION_TYPE.REPORTS_BY_TASK,
  [AGGERGATION_WIDGET_TYPE.IQR_BOX_PLOT]: AGGREGATION_TYPE.NUMBERS_LIST,
  [AGGERGATION_WIDGET_TYPE.CALENDAR]: AGGREGATION_TYPE.COUNT_PER_DATE,
  [AGGERGATION_WIDGET_TYPE.DEFAULT]: AGGREGATION_TYPE.VALUES_LIST
}

const AGGREGATION_TYPE_FUNCTION = {
  [AGGREGATION_TYPE.REPORTS_BY_TASK]: reportsByTaskAggregation,
  [AGGREGATION_TYPE.COUNT_PER_VALUE]: countPerValueAggregation,
  [AGGREGATION_TYPE.COUNT_PER_DATE]: countPerDateAggregation,
  [AGGREGATION_TYPE.NUMBERS_LIST]: numbersListAggregation,
  [AGGREGATION_TYPE.VALUES_LIST]: valuesListAggregation,
  [AGGREGATION_TYPE.LIKERT_SCALE_AND_PIE_AGG]: likertScaleAndPieAggregation
}

export const getAggregationWidget = (
  fieldConfig,
  defaultWidgetPerFieldType = DEFAULT_AGGREGATION_WIDGET_PER_FIELD_TYPE,
  ignoreFieldConfigWidget = false
) => {
  const widget = !ignoreFieldConfigWidget && fieldConfig.aggregation?.widget
  const defaultWidget = defaultWidgetPerFieldType[fieldConfig.type]
  const defaultWidgetIsObject = typeof defaultWidget === "object"
  return (
    widget ||
    (defaultWidget &&
      defaultWidgetIsObject &&
      defaultWidget[fieldConfig.widget]) ||
    (!defaultWidgetIsObject && defaultWidget) ||
    null
  )
}

const getAggregationFunction = (fieldConfig, aggregationWidget) => {
  const aggregationType =
    fieldConfig.aggregation?.aggregationType ||
    DEFAULT_AGGREGATION_TYPE_PER_WIDGET_TYPE[aggregationWidget]
  return aggregationType
    ? AGGREGATION_TYPE_FUNCTION[aggregationType] || null
    : null
}

const AggregationWidgetContainer = ({
  data,
  fieldConfig,
  fieldName,
  vertical,
  widget,
  period,
  ...otherWidgetProps
}) => {
  const aggregationWidget = widget || getAggregationWidget(fieldConfig)
  const aggregationFunction = getAggregationFunction(
    fieldConfig,
    aggregationWidget
  )
  if (!aggregationFunction) {
    return null
  }

  const { values, ...otherAggregationDetails } = aggregationFunction(
    fieldName,
    fieldConfig,
    data
  )
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  let label = fieldProps.label
  if (label === undefined) {
    label = utils.sentenceCase(fieldName) // name is a required prop of field
  }
  const WidgetComponent =
    (aggregationWidget && AGGREGATION_WIDGET_COMPONENTS[aggregationWidget]) ||
    AGGREGATION_WIDGET_COMPONENTS.default
  const widgetElem = (
    <WidgetComponent
      values={values}
      vertical={vertical}
      fieldConfig={fieldConfig}
      fieldName={fieldName}
      period={period}
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
  fieldConfig: PropTypes.object.isRequired,
  fieldName: PropTypes.string.isRequired,
  period: PropTypes.oneOfType([AssessmentPeriodPropType, PeriodPropType]),
  vertical: PropTypes.bool,
  widget: PropTypes.string
}
AggregationWidgetContainer.defaultProps = {
  vertical: true,
  widget: ""
}

export default AggregationWidgetContainer
