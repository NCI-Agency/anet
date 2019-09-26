import { IconNames } from "@blueprintjs/icons"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import BarChart from "components/BarChart"
import MosaicLayout from "components/MosaicLayout"
import { useBoilerplate } from "components/Page"
import ReportCollection, {
  FORMAT_MAP,
  FORMAT_SUMMARY,
  FORMAT_TABLE,
  FORMAT_CALENDAR
} from "components/ReportCollection"
import * as d3 from "d3"
import _isEqual from "lodash/isEqual"
import PropTypes from "prop-types"
import React, { useMemo, useState } from "react"
import ContainerDimensions from "react-container-dimensions"

const GQL_GET_REPORT_LIST_BY_ORG = gql`
  query($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        advisorOrg {
          uuid
          shortName
        }
      }
    }
  }
`
const GQL_GET_REPORT_LIST_BY_REASON = gql`
  query($reportQuery: ReportSearchQueryInput) {
    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        cancelledReason
      }
    }
  }
`

const ChartByOrg = props => {
  const {
    chartId,
    queryParams,
    focusedSelection,
    goToSelection,
    selectedBarClass
  } = props
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST_BY_ORG, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
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
      if (!d.advisorOrg) d.advisorOrg = noAdvisorOrg
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
        let aIndex = pinnedOrgs.indexOf(a.advisorOrg.shortName)
        let bIndex = pinnedOrgs.indexOf(b.advisorOrg.shortName)
        if (aIndex < 0) {
          return bIndex < 0
            ? a.advisorOrg.shortName.localeCompare(b.advisorOrg.shortName)
            : 1
        } else return bIndex < 0 ? -1 : aIndex - bIndex
      })
  }, [data])
  if (done) {
    return result
  }

  return (
    <div className="non-scrollable">
      <ContainerDimensions>
        {({ width, height }) => (
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
              <h4>${d.advisorOrg.shortName}</h4>
              <p>${d.cancelledByOrg}</p>
            `}
            selectedBarClass={selectedBarClass}
            selectedBar={
              focusedSelection && focusedSelection.focusedIsOrg
                ? "bar_" + focusedSelection.focusedSelection.advisorOrg.uuid
                : ""
            }
          />
        )}
      </ContainerDimensions>
    </div>
  )
}

ChartByOrg.propTypes = {
  chartId: PropTypes.string,
  queryParams: PropTypes.object,
  focusedSelection: PropTypes.object,
  goToSelection: PropTypes.func,
  selectedBarClass: PropTypes.string
}

const ChartByReason = props => {
  const {
    chartId,
    queryParams,
    focusedSelection,
    goToSelection,
    selectedBarClass
  } = props
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
    ...props
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
      if (!d.cancelledReason) d.cancelledReason = "NO_REASON_GIVEN"
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
    <div className="non-scrollable">
      <ContainerDimensions>
        {({ width, height }) => (
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
              <h4>${d.reason}</h4>
              <p>${d.cancelledByReason}</p>
            `}
            selectedBarClass={selectedBarClass}
            selectedBar={
              focusedSelection && !focusedSelection.focusedIsOrg
                ? "bar_" + focusedSelection.focusedSelection.cancelledReason
                : ""
            }
          />
        )}
      </ContainerDimensions>
    </div>
  )

  function getReasonDisplayName(reason) {
    return reason
      ? reason
        .replace("CANCELLED_", "")
        .replace(/_/g, " ")
        .toLocaleLowerCase()
        .replace(/(\b\w)/gi, function(m) {
          return m.toUpperCase()
        })
      : ""
  }
}

ChartByReason.propTypes = {
  chartId: PropTypes.string,
  queryParams: PropTypes.object,
  focusedSelection: PropTypes.object,
  goToSelection: PropTypes.func,
  selectedBarClass: PropTypes.string
}

const Collection = props => {
  const { id, queryParams } = props

  return (
    <div className="scrollable">
      <ReportCollection
        paginationKey={`r_${id}`}
        queryParams={queryParams}
        viewFormats={[FORMAT_CALENDAR, FORMAT_TABLE, FORMAT_SUMMARY]}
      />
    </div>
  )
}

Collection.propTypes = {
  id: PropTypes.string,
  queryParams: PropTypes.object
}

const Map = props => {
  const { queryParams } = props

  return (
    <div className="non-scrollable">
      <ContainerDimensions>
        {({ width, height }) => (
          <ReportCollection
            queryParams={queryParams}
            width={width}
            height={height}
            marginBottom={0}
            viewFormats={[FORMAT_MAP]}
          />
        )}
      </ContainerDimensions>
    </div>
  )
}

Map.propTypes = {
  queryParams: PropTypes.object
}

/*
 * Component displaying a chart with reports cancelled since
 * the given date.
 */
const CancelledEngagementReports = props => {
  const { queryParams, style } = props
  const [focusedSelection, setFocusedSelection] = useState(null)

  const advisorOrgLabel = Settings.fields.advisor.org.name
  const chartIdByOrg = "cancelled_reports_by_org"
  const chartIdByReason = "cancelled_reports_by_reason"
  const selectedBarClass = "selected-bar"
  const VISUALIZATIONS = [
    {
      id: "cer-chart-by-org",
      icons: [IconNames.GROUPED_BAR_CHART, IconNames.DIAGRAM_TREE],
      title: `Chart by ${advisorOrgLabel}`,
      renderer: getChartByOrg
    },
    {
      id: "cer-chart-by-reason",
      icons: [IconNames.GROUPED_BAR_CHART, IconNames.COMMENT],
      title: "Chart by reason for cancellation",
      renderer: getChartByReason
    },
    {
      id: "cer-collection",
      icons: [IconNames.PANEL_TABLE],
      title: "Reports",
      renderer: getReportCollection
    },
    {
      id: "cer-map",
      icons: [IconNames.MAP],
      title: "Map",
      renderer: getReportMap
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

  function getChartByOrg(id) {
    return (
      <ChartByOrg
        chartId={chartIdByOrg}
        queryParams={queryParams}
        focusedSelection={focusedSelection}
        goToSelection={goToOrg}
        selectedBarClass={selectedBarClass}
      />
    )
  }

  function getChartByReason(id) {
    return (
      <ChartByReason
        chartId={chartIdByReason}
        queryParams={queryParams}
        focusedSelection={focusedSelection}
        goToSelection={goToReason}
        selectedBarClass={selectedBarClass}
      />
    )
  }

  function getReportCollection(id) {
    return <Collection queryParams={getQueryParams()} />
  }

  function getReportMap(id) {
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
      ? { advisorOrgUuid: focusedSelection.focusedSelection.advisorOrg.uuid }
      : { cancelledReason: focusedSelection.focusedSelection.cancelledReason }
  }
}

CancelledEngagementReports.propTypes = {
  queryParams: PropTypes.object,
  style: PropTypes.object
}

export default CancelledEngagementReports
