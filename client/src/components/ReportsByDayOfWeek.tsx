import { gql } from "@apollo/client"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
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
import moment from "moment"
import React, { useMemo, useState } from "react"
import { useResizeDetector } from "react-resize-detector"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        engagementDayOfWeek
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
    // The server returns values from 0 to 6
    const daysOfWeekInt = [0, 1, 2, 3, 4, 5, 6]
    // The day of the week (returned by the server) with value 0 is Sunday
    // See https://momentjs.com/docs/#/i18n/locale-data/
    const daysOfWeek = moment.localeData().weekdays(false)
    // Set the order in which to display the days of the week
    const displayOrderDaysOfWeek = moment.localeData().weekdays(true)
    const reportsList = data.reportList.list || []
    if (!reportsList.length) {
      return []
    }
    const simplifiedValues = reportsList.map(d => {
      return { reportUuid: d.uuid, dayOfWeek: d.engagementDayOfWeek }
    })
    return displayOrderDaysOfWeek.map(d => {
      const r = {}
      r.dayOfWeekInt = daysOfWeekInt[daysOfWeek.indexOf(d)]
      r.dayOfWeekString = d
      r.reportsCount = simplifiedValues.filter(
        item => item.dayOfWeek === r.dayOfWeekInt
      ).length
      return r
    })
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
        xProp="dayOfWeekInt"
        yProp="reportsCount"
        xLabel="dayOfWeekString"
        onBarClick={goToSelection}
        tooltip={d => `
              <h4>${_escape(d.dayOfWeekString)}</h4>
              <p>${_escape(d.reportsCount)}</p>
            `}
        selectedBarClass={selectedBarClass}
        selectedBar={
          focusedSelection ? "bar_" + focusedSelection.dayOfWeekInt : ""
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

interface ReportsByDayOfWeekProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  style?: any
}

/*
 * Component displaying a chart with number of reports within a certain period.
 * The counting is done grouped by day of the week.
 */
const ReportsByDayOfWeek = ({
  pageDispatchers,
  queryParams,
  style
}: ReportsByDayOfWeekProps) => {
  const [focusedSelection, setFocusedSelection] = useState(null)
  usePageTitle("Reports by Day of the Week")

  const chartId = "reports_by_day_of_week"
  const selectedBarClass = "selected-bar"
  const VISUALIZATIONS = [
    {
      id: "rbdow-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: "Chart by day of the week",
      renderer: renderChart
    },
    {
      id: "rbdow-collection",
      icons: [IconNames.PANEL_TABLE],
      title: "Reports by day of the week",
      renderer: renderReportCollection
    },
    {
      id: "rbdow-map",
      icons: [IconNames.MAP],
      title: "Map by day of the week",
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
  const DESCRIPTION = `The reports are grouped by day of the week.
    In order to see the list of reports for a day of the week,
    click on the bar corresponding to the day of the week.`

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

  function updateHighlight(focusedSelection, clear) {
    const focusedSelectionId = focusedSelection
      ? focusedSelection.dayOfWeekInt
      : ""
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
    return { engagementDayOfWeek: focusedSelection.dayOfWeekInt }
  }
}

export default ReportsByDayOfWeek
