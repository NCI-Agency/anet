import AggregationWidget from "components/AggregationWidget"
import { getFieldPropsFromFieldConfig } from "components/CustomFields"
import PropTypes from "prop-types"
import React from "react"

const ValuesListAggregation = ({ fieldName, fieldConfig, data }) => {
  const values = data.map(item => Object.get(item, fieldName))
  const aggWidgetProps = {
    widget: fieldConfig.aggregation?.widget || fieldConfig.widget,
    aggregationType: fieldConfig.aggregation?.aggregationType,
    vertical: true
  }
  const fieldProps = getFieldPropsFromFieldConfig(fieldConfig)
  return (
    <AggregationWidget
      key={`assessment-${fieldName}`}
      values={values}
      {...aggWidgetProps}
      {...fieldProps}
    />
  )
}
ValuesListAggregation.propTypes = {
  data: PropTypes.array,
  fieldName: PropTypes.string,
  fieldConfig: PropTypes.object
}

export default ValuesListAggregation
