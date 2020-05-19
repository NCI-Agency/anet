import BarChart from "components/BarChart"
import { getFieldPropsFromFieldConfig } from "components/CustomFields"
import LikertScale from "components/graphs/LikertScale"
import Pie from "components/graphs/Pie"
import _uniqueId from "lodash/uniqueId"
import PropTypes from "prop-types"
import React from "react"
import { Col, ControlLabel, FormGroup } from "react-bootstrap"

const aggregationPropTypes = {
  values: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.array,
        PropTypes.object
      ])
    )
  ]),
  aggregationType: PropTypes.string
}

const arrayOfNumbers = arr =>
  arr.filter(n => !isNaN(parseFloat(n)) && isFinite(n)).map(n => Number(n))

const NUMBER_AGG = {
  sum: arr => arr.reduce((a, b) => a + b),
  avg: arr => arr.reduce((a, b) => a + b) / arr.length,
  min: arr => Math.min(...arr),
  max: arr => Math.max(...arr)
}

const NumberAggWidget = ({ values, aggregationType, ...otherWidgetProps }) =>
  values?.length ? (
    <div>{NUMBER_AGG[aggregationType](arrayOfNumbers(values))}</div>
  ) : null
NumberAggWidget.propTypes = aggregationPropTypes

const PieWidget = ({
  values,
  aggregationType,
  legend,
  ...otherWidgetProps
}) => {
  return (
    <>
      <Pie
        width={70}
        height={70}
        data={values}
        label={Object.values(values).reduce((acc, cur) => acc + cur, 0)}
        segmentFill={entity => legend[entity.data.key]?.color}
        segmentLabel={d => d.data.value}
      />
      <br />
      {Object.map(legend, (key, choice) => (
        <React.Fragment key={key}>
          <span style={{ backgroundColor: choice.color }}>{choice.label} </span>
        </React.Fragment>
      ))}
    </>
  )
}
PieWidget.propTypes = {
  legend: PropTypes.object,
  ...aggregationPropTypes
}

const ReportsByTaskWidget = ({
  values,
  aggregationType,
  ...otherWidgetProps
}) => {
  return (
    <div className="non-scrollable">
      <BarChart
        chartId={_uniqueId("ReportsByTaskWidget")}
        data={values}
        xProp="task.uuid"
        yProp="reportsCount"
        xLabel="task.shortName"
        tooltip={d => `
        <h4>${d.task.shortName}</h4>
        <p>${d.reportsCount}</p>
      `}
      />
    </div>
  )
}
ReportsByTaskWidget.propTypes = aggregationPropTypes

const DefaultAggWidget = ({ values, ...otherWidgetProps }) => (
  <div>{`[${values}]`}</div>
)
DefaultAggWidget.propTypes = aggregationPropTypes

const WIDGET_COMPONENTS = {
  likertScale: LikertScale,
  numberAggregation: NumberAggWidget,
  reportsByTask: ReportsByTaskWidget,
  countPerValue: PieWidget,
  default: DefaultAggWidget
}

const AggregationWidget = ({
  fieldConfig,
  values,
  vertical,
  ...otherWidgetProps
}) => {
  const aggregationType = fieldConfig.aggregation?.aggregationType
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  const label = fieldProps.label
  const widget = fieldConfig.aggregation?.widget || fieldConfig.widget
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
AggregationWidget.propTypes = {
  values: PropTypes.any,
  fieldConfig: PropTypes.object,
  vertical: PropTypes.bool
}
AggregationWidget.defaultProps = {
  vertical: true
}

export default AggregationWidget
