import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes
} from "components/aggregations/utils"
import BarChart from "components/BarChart"
import React from "react"

const ReportsByTaskWidget = ({ widgetId, values, ...otherWidgetProps }) => (
  <div className="non-scrollable">
    <BarChart
      chartId={`ReportsByTaskWidget-${widgetId}`}
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
ReportsByTaskWidget.propTypes = aggregationWidgetPropTypes
ReportsByTaskWidget.defaultProps = aggregationWidgetDefaultProps

export default ReportsByTaskWidget
