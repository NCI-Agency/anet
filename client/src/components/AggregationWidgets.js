import LikertScale from "components/graphs/LikertScale"
import PropTypes from "prop-types"
import React from "react"
import { Col, ControlLabel, Row } from "react-bootstrap"

const arrayOfNumbers = arr => arr.map(x => Number(x))

const NUMBER_AGG = {
  sum: arr => arrayOfNumbers(arr).reduce((a, b) => a + b, 0),
  avg: arr => arrayOfNumbers(arr).reduce((a, b) => a + b, 0) / arr.length,
  min: arr => Math.min(...arrayOfNumbers(arr)),
  max: arr => Math.max(...arrayOfNumbers(arr))
}

const NumberAggWidget = ({ values, aggregationType, ...otherWidgetProps }) =>
  NUMBER_AGG[aggregationType](values)

const DefaultAggWidget = ({ values, aggregationType, ...otherWidgetProps }) =>
  values.length + " values: [" + values + "]"

const WIDGETS = {
  likertScaleAggregation: LikertScale,
  likertScale: LikertScale,
  numberAggregation: NumberAggWidget,
  listAggregation: DefaultAggWidget
}

const AggregationWidget = ({
  label,
  widget,
  defaultWidget,
  values,
  aggregationType,
  ...otherWidgetProps
}) => {
  const Widget = widget ? WIDGETS[widget] : WIDGETS[defaultWidget]
  return (
    <Row>
      {label !== null && (
        <Col sm={2} componentClass={ControlLabel}>
          {label}
        </Col>
      )}
      <Col sm={10}>
        <div>
          {Widget && (
            <Widget
              values={values}
              aggregationType={aggregationType}
              {...otherWidgetProps}
            />
          )}
        </div>
      </Col>
    </Row>
  )
}
AggregationWidget.propTypes = {
  label: PropTypes.string,
  widget: PropTypes.string,
  defaultWidget: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.number),
  aggregationType: PropTypes.string
}
AggregationWidget.defaultProps = {
  label: "",
  values: [],
  aggregationType: ""
}

export default AggregationWidget
