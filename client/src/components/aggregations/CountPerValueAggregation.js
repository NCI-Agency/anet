import AggregationWidgetContainer from "components/aggregations/AggregationWidgetContainer"
import _clone from "lodash/clone"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"

// TODO: maybe use a library for a list of colors
const CHART_COLORS = [
  "#3366CC",
  "#DC3912",
  "#FF9900",
  "#109618",
  "#990099",
  "#3B3EAC",
  "#0099C6",
  "#DD4477",
  "#66AA00",
  "#B82E2E",
  "#316395",
  "#994499",
  "#22AA99",
  "#AAAA11",
  "#6633CC",
  "#E67300",
  "#8B0707",
  "#329262",
  "#5574A6",
  "#3B3EAC"
]
const CountPerValueAggregation = ({ fieldName, fieldConfig, data }) => {
  const counters = data.reduce((counter, entity) => {
    const value = Object.get(entity, fieldName) || null
    counter[value] = ++counter[value] || 1
    return counter
  }, {})
  const legendColors = _clone(CHART_COLORS)
  const legend = fieldConfig?.choices || {}
  const legendKeys = !_isEmpty(legend)
    ? Object.keys(legend)
    : Object.keys(counters)
  legendKeys.forEach(
    key =>
      (legend[key] = {
        label: legend[key]?.label || key,
        color: legend[key]?.color || legendColors.pop()
      })
  )
  legend.null = { label: "Unspecified", color: "#bbbbbb" }

  return (
    <AggregationWidgetContainer
      key={`assessment-${fieldName}`}
      fieldConfig={fieldConfig}
      values={counters}
      legend={legend}
    />
  )
}
CountPerValueAggregation.propTypes = {
  data: PropTypes.array,
  fieldName: PropTypes.string,
  fieldConfig: PropTypes.object
}

export default CountPerValueAggregation
