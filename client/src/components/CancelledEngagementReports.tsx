import {
  gqlMinimalOrganizationFields,
  gqlMinimalReportFields
} from "constants/GraphQLDefinitions"
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
import React, { useMemo, useState } from "react"
import { useResizeDetector } from "react-resize-detector"
import Settings from "settings"

const GQL_GET_REPORT_LIST_BY_ORG = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        ${gqlMinimalReportFields}
        advisorOrg {
          ${gqlMinimalOrganizationFields}
        }
      }
    }
  }
`
const GQL_GET_REPORT_LIST_BY_REASON = gql`
  query ($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        ${gqlMinimalReportFields}
      }
    }
  }
`

interface ChartByOrgProps {
  pageDispatchers?: PageDispatchersPropType
  chartId?: string
  queryParams?: any
  focusedSelection?: any
  goToSelection?: (...args: unknown[]) => unknown
  selectedBarClass?: string
}

const ChartByOrg = ({
  pageDispatchers,
  chartId,
  queryParams,
  focusedSelection,
  goToSelection,
  selectedBarClass
}: ChartByOrgProps) => {
  const { width, height, ref } = useResizeDetector()
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST_BY_ORG, {
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
    const pinnedOrgs = Settings.pinned_ORGs
    const noAdvisorOrg = {
      uuid: "-1",
      shortName: `No ${Settings.fields.advisor.org.name}`
    }
    let reportsList = data.reportList.list || []
    if (!reportsList.length) {
      return []
    }
    reportsList = reportsList.map(d => {
      if (!d.advisorOrg) {
        d.advisorOrg = noAdvisorOrg
      }
      return d
    })
    return reportsList
      .filter(
        (item, index, d) =>
          d.findIndex(t => {
            return t.advisorOrg.uuid === item.advisorOrg.uuid
          }) === index
      )
      .map(d => {
        d.cancelledByOrg = reportsList.filter(
          item => item.advisorOrg.uuid === d.advisorOrg.uuid
        ).length
        return d
      })
      .sort((a, b) => {
        const aIndex = pinnedOrgs.indexOf(a.advisorOrg.shortName)
        const bIndex = pinnedOrgs.indexOf(b.advisorOrg.shortName)
        if (aIndex < 0) {
          return bIndex < 0
            ? a.advisorOrg.shortName.localeCompare(b.advisorOrg.shortName)
            : 1
        } else {
          return bIndex < 0 ? -1 : aIndex - bIndex
        }
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
        xProp="advisorOrg.uuid"
        yProp="cancelledByOrg"
        xLabel="advisorOrg.shortName"
        onBarClick={goToSelection}
        tooltip={d => `
          <h4>${_escape(d.advisorOrg.shortName)}</h4>
          <p>${_escape(d.cancelledByOrg)}</p>
        `}
        selectedBarClass={selectedBarClass}
        selectedBar={
          focusedSelection && focusedSelection.focusedIsOrg
            ? "bar_" + focusedSelection.focusedSelection.advisorOrg.uuid
            : ""
        }
      />
    </div>
  )
}

interface ChartByReasonProps {
  pageDispatchers?: PageDispatchersPropType
  chartId?: string
  queryParams?: any
  focusedSelection?: any
  goToSelection?: (...args: unknown[]) => unknown
  selectedBarClass?: string
}

const ChartByReason = ({
  pageDispatchers,
  chartId,
  queryParams,
  focusedSelection,
  goToSelection,
  selectedBarClass
}: ChartByReasonProps) => {
  const { width, height, ref } = useResizeDetector()
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_REPORT_LIST_BY_REASON,
    {
      reportQuery
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  const graphData = useMemo(() => {
    if (!data) {
      return []
    }
    let reportsList = data.reportList.list || []
    if (!reportsList.length) {
      return []
    }
    reportsList = reportsList.map(d => {
      if (!d.cancelledReason) {
        d.cancelledReason = "NO_REASON_GIVEN"
      }
      return d
    })
    return reportsList
      .filter(
        (item, index, d) =>
          d.findIndex(t => {
            return t.cancelledReason === item.cancelledReason
          }) === index
      )
      .map(d => {
        d.cancelledByReason = reportsList.filter(
          item => item.cancelledReason === d.cancelledReason
        ).length
        return d
      })
      .map(d => {
        d.reason = getReasonDisplayName(d.cancelledReason)
        return d
      })
      .sort((a, b) => {
        return a.reason.localeCompare(b.reason)
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
        xProp="cancelledReason"
        yProp="cancelledByReason"
        xLabel="reason"
        onBarClick={goToSelection}
        tooltip={d => `
          <h4>${_escape(d.reason)}</h4>
          <p>${_escape(d.cancelledByReason)}</p>
        `}
        selectedBarClass={selectedBarClass}
        selectedBar={
          focusedSelection && !focusedSelection.focusedIsOrg
            ? "bar_" + focusedSelection.focusedSelection.cancelledReason
            : ""
        }
      />
    </div>
  )

  function getReasonDisplayName(reason) {
    return reason
      ? reason
          .replace("CANCELLED_", "")
          .replace(/_/g, " ")
          .toLocaleLowerCase()
          .replace(/(\b\w)/gi, function (m) {
            return m.toUpperCase()
          })
      : ""
  }
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

interface CancelledEngagementReportsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  style?: any
}

/*
 * Component displaying a chart with reports cancelled since
 * the given date.
 */
const CancelledEngagementReports = ({
  pageDispatchers,
  queryParams,
  style
}: CancelledEngagementReportsProps) => {
  const [focusedSelection, setFocusedSelection] = useState(null)
  usePageTitle("Cancelled Engagement Reports")

  const advisorOrgLabel = Settings.fields.advisor.org.name
  const chartIdByOrg = "cancelled_reports_by_org"
  const chartIdByReason = "cancelled_reports_by_reason"
  const selectedBarClass = "selected-bar"
  const VISUALIZATIONS = [
    {
      id: "cer-chart-by-org",
      icons: [IconNames.GROUPED_BAR_CHART, IconNames.DIAGRAM_TREE],
      title: `Chart by ${advisorOrgLabel}`,
      renderer: renderChartByOrg
    },
    {
      id: "cer-chart-by-reason",
      icons: [IconNames.GROUPED_BAR_CHART, IconNames.COMMENT],
      title: "Chart by reason for cancellation",
      renderer: renderChartByReason
    },
    {
      id: "cer-collection",
      icons: [IconNames.PANEL_TABLE],
      title: "Reports",
      renderer: renderReportCollection
    },
    {
      id: "cer-map",
      icons: [IconNames.MAP],
      title: "Map",
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
    second: {
      direction: "row",
      first: VISUALIZATIONS[2].id,
      second: VISUALIZATIONS[3].id
    }
  }
  const DESCRIPTION = `The reports are grouped by ${advisorOrgLabel} or reason for cancellation.
    In order to see the list of cancelled engagement reports for an organization or a reason,
    click on the bar corresponding to the organization or the reason.`

  return (
    <MosaicLayout
      style={style}
      visualizations={VISUALIZATIONS}
      initialNode={INITIAL_LAYOUT}
      description={DESCRIPTION}
    />
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function renderChartByOrg(id) {
    return (
      <ChartByOrg
        pageDispatchers={pageDispatchers}
        chartId={chartIdByOrg}
        queryParams={queryParams}
        focusedSelection={focusedSelection}
        goToSelection={goToOrg}
        selectedBarClass={selectedBarClass}
      />
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function renderChartByReason(id) {
    return (
      <ChartByReason
        pageDispatchers={pageDispatchers}
        chartId={chartIdByReason}
        queryParams={queryParams}
        focusedSelection={focusedSelection}
        goToSelection={goToReason}
        selectedBarClass={selectedBarClass}
      />
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function renderReportCollection(id) {
    return <Collection queryParams={getQueryParams()} />
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
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

  function goToOrg(item) {
    const newFocus = item
      ? { focusedIsOrg: true, focusedSelection: item }
      : null
    goToSelection(newFocus, chartIdByOrg)
  }

  function goToReason(item) {
    const newFocus = item
      ? { focusedIsOrg: false, focusedSelection: item }
      : null
    goToSelection(newFocus, chartIdByReason)
  }

  function goToSelection(item, chartId) {
    updateHighlight(null, true, chartId)
    if (!item || _isEqual(item, focusedSelection)) {
      setFocusedSelection(null)
    } else {
      setFocusedSelection(item)
      updateHighlight(item, false, chartId)
    }
  }

  function updateHighlight(item, clear, chartId) {
    const focusedSelectionId = item
      ? item.focusedIsOrg
        ? item.focusedSelection.advisorOrg.uuid
        : item.focusedSelection.cancelledReason
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
    return focusedSelection.focusedIsOrg
      ? { orgUuid: focusedSelection.focusedSelection.advisorOrg.uuid }
      : { cancelledReason: focusedSelection.focusedSelection.cancelledReason }
  }
}

export default CancelledEngagementReports
