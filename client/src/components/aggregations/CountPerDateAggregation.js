import AggregationWidgetContainer from "components/aggregations/AggregationWidgetContainer"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"

const CountPerDateAggregation = ({ fieldName, fieldConfig, data }) => {
  const countPerDate = data.reduce((counter, entity) => {
    const dateFieldValue = Object.get(entity, fieldName)
    const value = dateFieldValue
      ? moment(dateFieldValue).format("YYYY-MM-DD")
      : null
    counter[value] = ++counter[value] || 1
    return counter
  }, {})

  return (
    <AggregationWidgetContainer
      key={`assessment-${fieldName}`}
      fieldConfig={fieldConfig}
      fieldName={fieldName}
      values={countPerDate}
    />
  )
}
CountPerDateAggregation.propTypes = {
  data: PropTypes.array,
  fieldName: PropTypes.string,
  fieldConfig: PropTypes.object
}

export default CountPerDateAggregation
