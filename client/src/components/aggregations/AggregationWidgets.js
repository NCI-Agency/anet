import BarChart from "components/BarChart"
import Pie from "components/graphs/Pie"
import _uniqueId from "lodash/uniqueId"
import PropTypes from "prop-types"
import React from "react"

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

export const PieWidget = ({
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

export const ReportsByTaskWidget = ({
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

export const DefaultAggWidget = ({ values, ...otherWidgetProps }) => (
  <div>{`[${values}]`}</div>
)
DefaultAggWidget.propTypes = aggregationPropTypes
