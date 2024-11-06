import {
  aggregationWidgetDefaultProps,
  AggregationWidgetPropType
} from "components/aggregations/utils"
import BarChart from "components/BarChart"
import _escape from "lodash/escape"
import React from "react"

const ReportsByTaskWidget = ({
  widgetId,
  values,
  ...otherWidgetProps
}: AggregationWidgetPropType) => (
  <div className="non-scrollable">
    <BarChart
      chartId={`ReportsByTaskWidget-${widgetId}`}
      data={values}
      xProp="task.uuid"
      yProp="reportsCount"
      xLabel="task.shortName"
      tooltip={d => `
        <h4>${_escape(d.task.shortName)}</h4>
        <p>${_escape(d.reportsCount)}</p>
      `}
    />
  </div>
)
ReportsByTaskWidget.defaultProps = aggregationWidgetDefaultProps

export default ReportsByTaskWidget
