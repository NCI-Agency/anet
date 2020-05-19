import AggregationWidgetContainer from "components/aggregations/AggregationWidgetContainer"
import PropTypes from "prop-types"
import React from "react"

const ValuesListAggregation = ({ fieldName, fieldConfig, data }) => {
  const values = data.map(item => Object.get(item, fieldName))
  return (
    <AggregationWidgetContainer
      key={`assessment-${fieldName}`}
      fieldConfig={fieldConfig}
      values={values}
    />
  )
}
ValuesListAggregation.propTypes = {
  data: PropTypes.array,
  fieldName: PropTypes.string,
  fieldConfig: PropTypes.object
}

export default ValuesListAggregation
