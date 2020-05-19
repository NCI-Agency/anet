import AggregationWidgetContainer from "components/aggregations/AggregationWidgetContainer"
import PropTypes from "prop-types"
import React from "react"

const arrayOfNumbers = arr =>
  arr.filter(n => !isNaN(parseFloat(n)) && isFinite(n)).map(n => Number(n))

const NumbersListAggregation = ({ fieldName, fieldConfig, data }) => {
  const values = data.map(item => Object.get(item, fieldName))
  const numberValues = arrayOfNumbers(values)
  return (
    <AggregationWidgetContainer
      key={`assessment-${fieldName}`}
      fieldConfig={fieldConfig}
      values={numberValues}
    />
  )
}
NumbersListAggregation.propTypes = {
  data: PropTypes.array,
  fieldName: PropTypes.string,
  fieldConfig: PropTypes.object
}

export default NumbersListAggregation
