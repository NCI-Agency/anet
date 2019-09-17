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
import { Overlay, Popover } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"

const GQL_GET_REPORT_LIST = gql`
  query($reportQuery: ReportSearchQueryInput) {
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

const ChartPopover = props => {
  const { graphPopover, hoveredBar } = props
  if (!graphPopover || !hoveredBar) {
    return null
  }

  return (
    <Overlay
      show
      placement="top"
      container={document.body}
      animation={false}
      target={() => graphPopover}
    >
      <Popover
        id="graph-popover"
        title={hoveredBar && hoveredBar.task.shortName}
      >
        <p style={{ textAlign: "center" }}>
          {hoveredBar && hoveredBar.reportsCount}
        </p>
      </Popover>
    </Overlay>
  )
}

ChartPopover.propTypes = {
  graphPopover: PropTypes.object,
  hoveredBar: PropTypes.object
}

const Chart = props => {
  const {
    chartId,
    queryParams,
    focusedSelection,
    goToSelection,
    selectedBarClass
  } = props
  const [popover, setPopover] = useState({
    graphPopover: null,
    hoveredBar: null
  })
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
    const noTaskMessage = `No ${Settings.fields.task.shortLabel}`
    const noTask = {
      uuid: "-1",
      shortName: noTaskMessage,
      longName: noTaskMessage
    }
    let reportsList = data.reportList.list || []
    if (reportsList.length) {
      let simplifiedValues = reportsList.map(d => {
        return { reportUuid: d.uuid, tasks: d.tasks.map(p => p.uuid) }
      })
      let tasks = reportsList.map(d => d.tasks)
      tasks = [].concat
        .apply([], tasks)
        .filter(
          (item, index, d) =>
            d.findIndex(t => {
              return t.uuid === item.uuid
            }) === index
        )
        .sort((a, b) => a.shortName.localeCompare(b.shortName))
      // add No Task item, in order to relate to reports without Tasks
      tasks.push(noTask)
      graphData = tasks.map(d => {
        let r = {}
        r.task = d
        r.reportsCount =
          d.uuid === noTask.uuid
            ? simplifiedValues.filter(item => item.tasks.length === 0).length
            : simplifiedValues.filter(item => item.tasks.indexOf(d.uuid) > -1)
              .length
        return r
      })
    }
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
            xProp="task.uuid"
            yProp="reportsCount"
            xLabel="task.shortName"
            onBarClick={goToSelection}
            showPopover={showPopover}
            hidePopover={hidePopover}
            selectedBarClass={selectedBarClass}
            selectedBar={
              focusedSelection ? "bar_" + focusedSelection.task.uuid : ""
            }
          />
        )}
      </ContainerDimensions>

      <ChartPopover {...popover} graphData={graphData} />
    </div>
  )

  function showPopover(g, h) {
    if (g && popover.graphPopover && _isEqual(g.id, popover.graphPopover.id)) {
      // Same graphPopover already set, but prevent state update
      // (because e.g. target.ownerDocument.lastModified will have changed)
      return
    }
    setPopover({ graphPopover: g, hoveredBar: h })
  }

  function hidePopover() {
    setPopover({ graphPopover: null, hoveredBar: null })
  }
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
 * Component displaying a chart with number of reports per Task.
 */
const ReportsByTask = props => {
  const { queryParams, style } = props
  const [focusedSelection, setFocusedSelection] = useState(null)

  const taskShortLabel = Settings.fields.task.shortLabel
  const chartId = "reports_by_task"
  const selectedBarClass = "selected-bar"
  const VISUALIZATIONS = [
    {
      id: "rbt-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: `Chart by ${taskShortLabel}`,
      renderer: getChart
    },
    {
      id: "rbt-collection",
      icons: [IconNames.PANEL_TABLE],
      title: `Reports by ${taskShortLabel}`,
      renderer: getReportCollection
    },
    {
      id: "rbt-map",
      icons: [IconNames.MAP],
      title: `Map by ${taskShortLabel}`,
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

ReportsByTask.propTypes = {
  queryParams: PropTypes.object,
  style: PropTypes.object
}

export default ReportsByTask
