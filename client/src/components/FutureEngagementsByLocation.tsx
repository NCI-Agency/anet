import { gql } from "@apollo/client"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import HorizontalBarChart from "components/HorizontalBarChart"
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
import Settings from "settings"

const GQL_GET_REPORT_LIST = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        engagementDate
        location {
          uuid
          name
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
  const { width, ref } = useResizeDetector()
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
    function getEngagementDateRangeArray() {
      const dateArray = []
      let currentDate, endDate
      if (queryParams.engagementDateStart < 0) {
        // Relative date
        endDate = moment().endOf("day")
        currentDate = moment(endDate)
          .add(moment.duration(queryParams.engagementDateStart))
          .startOf("day")
      } else {
        endDate = moment(queryParams.engagementDateEnd)
        currentDate = moment(queryParams.engagementDateStart)
      }
      while (currentDate <= endDate) {
        dateArray.push(currentDate.clone())
        currentDate = currentDate.add(1, "days")
      }
      return dateArray
    }

    if (!data) {
      return {}
    }
    const noLocation = {
      uuid: "-1",
      name: "No location allocated"
    }
    let reportsList = data.reportList.list || []
    if (!reportsList.length) {
      return {}
    }
    reportsList = reportsList.map(d => {
      if (!d.location) {
        d.location = noLocation
      }
      return d
    })
    // add days without data as we want to display them in the chart
    const allCategories = getEngagementDateRangeArray().map(function (d) {
      return {
        key: d.valueOf(),
        values: [{}]
      }
    })
    const categoriesWithData = Array.from(
      d3.rollup(
        reportsList,
        leaves => leaves.length,
        d => moment(d.engagementDate).startOf("day").valueOf(),
        d => d.location.uuid
      ),
      ([key, values]) => ({
        key,
        values: Array.from(values, ([key, value]) => ({
          key,
          value
        }))
      })
    )
    const groupedData = allCategories.map(d => {
      const categData = categoriesWithData.find(x => {
        return Number(x.key) === d.key
      })
      return Object.assign({}, d, categData)
    })
    const categoryLabels = allCategories.reduce(function (prev, curr) {
      prev[curr.key] = moment(curr.key).format(
        Settings.dateFormats.forms.displayShort.date
      )
      return prev
    }, {})
    const leavesLabels = reportsList.reduce(function (prev, curr) {
      prev[curr.location.uuid] = curr.location.name
      return prev
    }, {})
    return { data: groupedData, categoryLabels, leavesLabels }
  }, [data, queryParams.engagementDateEnd, queryParams.engagementDateStart])
  if (done) {
    return result
  }

  return (
    <div ref={ref} className="scrollable-y">
      <HorizontalBarChart
        width={width}
        chartId={chartId}
        data={graphData}
        onBarClick={goToSelection}
        tooltip={d => `
              <h4>${_escape(graphData.categoryLabels[d.parentKey])}</h4>
              <p>${_escape(graphData.leavesLabels[d.key])}: ${_escape(
                d.value
              )}</p>
            `}
        selectedBarClass={selectedBarClass}
        selectedBar={
          focusedSelection
            ? "bar_" + focusedSelection.key + focusedSelection.parentKey
            : ""
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

interface FutureEngagementsByLocationProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  style?: any
}

/*
 * Component displaying a chart with number of future engagements per date and
 * location. Locations are grouped per date.
 */
const FutureEngagementsByLocation = ({
  pageDispatchers,
  queryParams,
  style
}: FutureEngagementsByLocationProps) => {
  const [focusedSelection, setFocusedSelection] = useState(null)
  usePageTitle("Future Engagements by Location")

  const chartId = "future_engagements_by_location"
  const selectedBarClass = "selected-bar"
  const VISUALIZATIONS = [
    {
      id: "febl-chart",
      icons: [IconNames.HORIZONTAL_BAR_CHART],
      title: "Chart by date and location",
      renderer: renderChart
    },
    {
      id: "febl-collection",
      icons: [IconNames.PANEL_TABLE],
      title: "Reports by date and location",
      renderer: renderReportCollection
    },
    {
      id: "febl-map",
      icons: [IconNames.MAP],
      title: "Map by date and location",
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
  const DESCRIPTION = `The engagements are grouped first by date and within the date per location.
    In order to see the list of engagements for a date and location,
    click on the bar corresponding to the date and location.`

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
    const focusedSelectionId = item ? item.key + item.parentKey : ""
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
    const focusedDate = focusedSelection
      ? parseInt(focusedSelection.parentKey, 10)
      : ""
    const focusedLocation = focusedSelection ? focusedSelection.key : ""
    return {
      // Use here the start and end of a date in order to make sure the
      // fetch is independent of the engagementDate time value
      engagementDateStart: moment(focusedDate).startOf("day").toISOString(),
      engagementDateEnd: moment(focusedDate).endOf("day").toISOString(),
      locationUuid: focusedLocation
    }
  }
}

export default FutureEngagementsByLocation
