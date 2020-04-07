import LikertScale from "components/graphs/LikertScale"
import PropTypes from "prop-types"
import React from "react"
import { Col, ControlLabel, FormGroup } from "react-bootstrap"

const aggregationPropTypes = {
  values: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array])
  ),
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

const DefaultAggWidget = ({ values, ...otherWidgetProps }) => (
  <div>{`[${values}]`}</div>
)
DefaultAggWidget.propTypes = aggregationPropTypes

const WIDGETS = {
  likertScale: LikertScale,
  numberAggregation: NumberAggWidget,
  default: DefaultAggWidget
}

const AggregationWidget = ({
  label,
  widget,
  values,
  aggregationType,
  vertical,
  ...otherWidgetProps
}) => {
  const Widget = (widget && WIDGETS[widget]) || WIDGETS.default
  const widgetElem = (
    <Widget
      values={values}
      aggregationType={aggregationType}
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
  label: PropTypes.string,
  widget: PropTypes.string,
  vertical: PropTypes.bool,
  ...aggregationPropTypes
}
AggregationWidget.defaultProps = {
  label: "",
  widget: "",
  values: [],
  aggregationType: "",
  vertical: false
}

export default AggregationWidget
