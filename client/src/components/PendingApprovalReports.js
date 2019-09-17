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
import React, { useState } from "react"
import ContainerDimensions from "react-container-dimensions"

const GQL_GET_REPORT_LIST = gql`
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

const Chart = props => {
  const {
    chartId,
    queryParams,
    focusedSelection,
    goToSelection,
    selectedBarClass
  } = props
  const reportQuery = Object.assign({}, queryParams, { pageSize: 0 })
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LIST, {
    reportQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  let graphData = []
  if (data) {
    const pinnedOrgs = Settings.pinned_ORGs
    const noAdvisorOrg = {
      uuid: "-1",
      shortName: `No ${Settings.fields.advisor.org.name}`
    }
    let reportsList = data.reportList.list || []
    reportsList = reportsList.map(d => {
      if (!d.advisorOrg) d.advisorOrg = noAdvisorOrg
      return d
    })
    graphData = reportsList
      .filter(
        (item, index, d) =>
          d.findIndex(t => {
            return t.advisorOrg.uuid === item.advisorOrg.uuid
          }) === index
      )
      .map(d => {
        d.notApproved = reportsList.filter(
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
        } else {
          return bIndex < 0 ? -1 : aIndex - bIndex
        }
      })
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
            yProp="notApproved"
            xLabel="advisorOrg.shortName"
            onBarClick={goToSelection}
            tooltip={d => `
              <h4>${d.advisorOrg.shortName}</h4>
              <p>${d.notApproved}</p>
            `}
            selectedBarClass={selectedBarClass}
            selectedBar={
              focusedSelection ? "bar_" + focusedSelection.advisorOrg.uuid : ""
            }
          />
        )}
      </ContainerDimensions>
    </div>
  )
}

Chart.propTypes = {
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
 * Component displaying reports submitted for approval up to the given date but
 * which have not been approved yet. They are displayed in different
 * presentation forms: chart, summary, table and map.
 */
const PendingApprovalReports = props => {
  const { queryParams, style } = props
  const [focusedSelection, setFocusedSelection] = useState(null)

  const advisorOrgLabel = Settings.fields.advisor.org.name
  const chartId = "not_approved_reports_chart"
  const selectedBarClass = "selected-bar"
  const VISUALIZATIONS = [
    {
      id: "par-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: `Chart by ${advisorOrgLabel}`,
      renderer: getChart
    },
    {
      id: "par-collection",
      icons: [IconNames.PANEL_TABLE],
      title: `Reports by ${advisorOrgLabel}`,
      renderer: getReportCollection
    },
    {
      id: "par-map",
      icons: [IconNames.MAP],
      title: `Map by ${advisorOrgLabel}`,
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
    second: VISUALIZATIONS[2].id
  }
  const DESCRIPTION = `The reports are grouped by ${advisorOrgLabel}.
    In order to see the list of pending approval reports for an organization,
    click on the bar corresponding to the organization.`

  return (
    <MosaicLayout
      style={style}
      visualizations={VISUALIZATIONS}
      initialNode={INITIAL_LAYOUT}
      description={DESCRIPTION}
    />
  )

  function getChart(id) {
    return (
      <Chart
        chartId={chartId}
        queryParams={queryParams}
        focusedSelection={focusedSelection}
        goToSelection={goToSelection}
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
    const focusedSelectionId = item ? item.advisorOrg.uuid : ""
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
    return { advisorOrgUuid: focusedSelection.advisorOrg.uuid }
  }
}

PendingApprovalReports.propTypes = {
  queryParams: PropTypes.object,
  style: PropTypes.object
}

export default PendingApprovalReports
