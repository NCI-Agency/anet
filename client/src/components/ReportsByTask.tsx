import { gql } from "@apollo/client"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { getReportsByTasks } from "components/aggregations/utils"
import BarChart from "components/BarChart"
import MosaicLayout from "components/MosaicLayout"
import {
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import ReportCollection, {
  FORMAT_CALENDAR,
  FORMAT_MAP,
  FORMAT_STATISTICS,
  FORMAT_SUMMARY,
  FORMAT_TABLE
} from "components/ReportCollection"
import * as d3 from "d3"
import _escape from "lodash/escape"
import _isEqual from "lodash/isEqual"
import React, { useMemo, useState } from "react"
import { useResizeDetector } from "react-resize-detector"
import Settings from "settings"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        tasks {
          uuid
          shortName
        }
      }
    }
  }
`

interface ChartProps {
  pageDispatchers?: PageDispatchersPropType
  chartId?: string
  queryParams?: any
  focusedSelection?: any
  goToSelection?: (...args: unknown[]) => unknown
  selectedBarClass?: string
}

const Chart = ({
  pageDispatchers,
  chartId,
  queryParams,
  focusedSelection,
  goToSelection,
  selectedBarClass
}: ChartProps) => {
  const { width, height, ref } = useResizeDetector()
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  const graphData = useMemo(() => {
    if (!data) {
      return []
    }
    return getReportsByTasks(data.reportList.list)
  }, [data])
  if (done) {
    return result
  }
  return (
    <div ref={ref} className="non-scrollable">
      <BarChart
        width={width}
        height={height}
        chartId={chartId}
        data={graphData}
        xProp="task.uuid"
        yProp="reportsCount"
        xLabel="task.shortName"
        onBarClick={goToSelection}
        tooltip={d => `
              <h4>${_escape(d.task.shortName)}</h4>
              <p>${_escape(d.reportsCount)}</p>
            `}
        selectedBarClass={selectedBarClass}
        selectedBar={
          focusedSelection ? "bar_" + focusedSelection.task.uuid : ""
        }
      />
    </div>
  )
}

interface CollectionProps {
  id?: string
  queryParams?: any
}

const Collection = ({ id, queryParams }: CollectionProps) => (
  <div className="scrollable">
    <ReportCollection
      paginationKey={`r_${id}`}
      queryParams={queryParams}
      viewFormats={[
        FORMAT_CALENDAR,
        FORMAT_TABLE,
        FORMAT_SUMMARY,
        FORMAT_STATISTICS
      ]}
    />
  </div>
)

interface MapProps {
  queryParams?: any
}

const Map = ({ queryParams }: MapProps) => {
  const { width, height, ref } = useResizeDetector()
  return (
    <div ref={ref} className="non-scrollable">
      <ReportCollection
        queryParams={queryParams}
        width={width}
        height={height}
        marginBottom={0}
        viewFormats={[FORMAT_MAP]}
      />
    </div>
  )
}

interface ReportsByTaskProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  style?: any
}

/*
 * Component displaying a chart with number of reports per Task.
 */
const ReportsByTask = ({
  pageDispatchers,
  queryParams,
  style
}: ReportsByTaskProps) => {
  const [focusedSelection, setFocusedSelection] = useState(null)
  usePageTitle(`Reports by ${Settings.fields.task.shortLabel}`)

  const taskShortLabel = Settings.fields.task.shortLabel
  const chartId = "reports_by_task"
  const selectedBarClass = "selected-bar"
  const VISUALIZATIONS = [
    {
      id: "rbt-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: `Chart by ${taskShortLabel}`,
      renderer: renderChart
    },
    {
      id: "rbt-collection",
      icons: [IconNames.PANEL_TABLE],
      title: `Reports by ${taskShortLabel}`,
      renderer: renderReportCollection
    },
    {
      id: "rbt-map",
      icons: [IconNames.MAP],
      title: `Map by ${taskShortLabel}`,
      renderer: renderReportMap
    }
  ]
  const INITIAL_LAYOUT = {
    direction: "column",
    first: {
      direction: "row",
      first: VISUALIZATIONS[0].id,
      second: VISUALIZATIONS[1].id
    },
    second: VISUALIZATIONS[2].id
  }
  const DESCRIPTION = `The reports are grouped by ${taskShortLabel}.
    In order to see the list of published reports for a ${taskShortLabel},
    click on the bar corresponding to the ${taskShortLabel}.`

  return (
    <MosaicLayout
      style={style}
      visualizations={VISUALIZATIONS}
      initialNode={INITIAL_LAYOUT}
      description={DESCRIPTION}
    />
  )

  function renderChart(id) {
    return (
      <Chart
        pageDispatchers={pageDispatchers}
        chartId={chartId}
        queryParams={queryParams}
        focusedSelection={focusedSelection}
        goToSelection={goToSelection}
        selectedBarClass={selectedBarClass}
      />
    )
  }

  function renderReportCollection(id) {
    return <Collection queryParams={getQueryParams()} />
  }

  function renderReportMap(id) {
    return <Map queryParams={getQueryParams()} />
  }

  function getQueryParams() {
    const sqParams = Object.assign({}, queryParams)
    if (focusedSelection) {
      Object.assign(sqParams, getAdditionalReportParams())
    }
    return sqParams
  }

  function goToSelection(item) {
    updateHighlight(null, true)
    if (!item || _isEqual(item, focusedSelection)) {
      setFocusedSelection(null)
    } else {
      setFocusedSelection(item)
      updateHighlight(item, false)
    }
  }

  function updateHighlight(item, clear) {
    const focusedSelectionId = item ? item.task.uuid : ""
    if (clear) {
      // remove highlighting of the bars
      d3.selectAll("#" + chartId + " rect").classed(selectedBarClass, false)
    } else if (focusedSelectionId) {
      // highlight the bar corresponding to the selected day of the week
      d3.select("#" + chartId + " #bar_" + focusedSelectionId).classed(
        selectedBarClass,
        true
      )
    }
  }

  function getAdditionalReportParams() {
    return { taskUuid: focusedSelection.task.uuid }
  }
}

export default ReportsByTask
