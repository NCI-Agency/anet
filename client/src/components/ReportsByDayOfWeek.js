import { IconNames } from "@blueprintjs/icons"
import autobind from "autobind-decorator"
import BarChart from "components/BarChart"
import ReportCollection, {
  FORMAT_MAP,
  FORMAT_SUMMARY,
  FORMAT_TABLE,
  FORMAT_CALENDAR
} from "components/ReportCollection"
import ReportsVisualisation, {
  propTypes as rvPropTypes
} from "components/ReportsVisualisation"
import LoaderHOC, { mapDispatchToProps } from "HOC/LoaderHOC"
import React from "react"
import { Overlay, Popover } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"

const BarChartWithLoader = connect(
  null,
  mapDispatchToProps
)(LoaderHOC("isLoading")("data")(BarChart))
const Context = React.createContext()

/*
 * Component displaying a chart with number of reports published within a certain
 * period. The counting is done grouped by day of the week.
 */
class ReportsByDayOfWeek extends ReportsVisualisation {
  static propTypes = { ...rvPropTypes }

  constructor(props) {
    super(props)

    this.CHART_ID = "reports_by_day_of_week"
    this.GQL_CHART_FIELDS = /* GraphQL */ `
      uuid
      engagementDayOfWeek
    `
    this.VISUALIZATIONS = [
      {
        id: "rbdow-chart",
        icons: [IconNames.GROUPED_BAR_CHART],
        title: "Chart by day of the week",
        renderer: this.getBarChart
      },
      {
        id: "rbdow-collection",
        icons: [IconNames.PANEL_TABLE],
        title: "Reports by day of the week",
        renderer: this.getReportCollection
      },
      {
        id: "rbdow-map",
        icons: [IconNames.MAP],
        title: "Map by day of the week",
        renderer: this.getReportMap
      }
    ]
    this.INITIAL_LAYOUT = {
      direction: "column",
      first: {
        direction: "row",
        first: this.VISUALIZATIONS[0].id,
        second: this.VISUALIZATIONS[1].id
      },
      second: this.VISUALIZATIONS[2].id
    }
    this.DESCRIPTION = `The reports are grouped by day of the week.
      In order to see the list of published reports for a day of the week,
      click on the bar corresponding to the day of the week.`

    this.state = {
      graphData: [],
      reports: {},
      allReports: [],
      reportsPageNum: 0,
      focusedSelection: "",
      graphPopover: null,
      hoveredBar: null,
      updateChart: true, // whether the chart needs to be updated
      isLoading: false
    }
  }

  get additionalReportParams() {
    return { engagementDayOfWeek: this.state.focusedSelection.dayOfWeekInt }
  }

  @autobind
  getBarChart(id) {
    return (
      <Context.Consumer>
        {context => (
          <div className="non-scrollable">
            <ContainerDimensions>
              {({ width, height }) => (
                <BarChartWithLoader
                  width={width}
                  height={height}
                  chartId={this.chartId}
                  data={context.graphData}
                  xProp="dayOfWeekInt"
                  yProp="reportsCount"
                  xLabel="dayOfWeekString"
                  onBarClick={this.goToSelection}
                  showPopover={this.showPopover}
                  hidePopover={this.hidePopover}
                  updateChart={context.updateChart}
                  selectedBarClass={this.selectedBarClass}
                  selectedBar={
                    context.focusedSelection
                      ? "bar_" + context.focusedSelection.dayOfWeekInt
                      : ""
                  }
                  isLoading={context.isLoading}
                />
              )}
            </ContainerDimensions>

            <Overlay
              show={!!context.graphPopover}
              placement="top"
              container={document.body}
              animation={false}
              target={() => context.graphPopover}
            >
              <Popover
                id="graph-popover"
                title={context.hoveredBar && context.hoveredBar.dayOfWeekString}
              >
                <p style={{ textAlign: "center" }}>
                  {context.hoveredBar && context.hoveredBar.reportsCount}
                </p>
              </Popover>
            </Overlay>
          </div>
        )}
      </Context.Consumer>
    )
  }

  @autobind
  getReportCollection(id) {
    return (
      <Context.Consumer>
        {context => (
          <div className="scrollable">
            <ReportCollection
              reports={context.allReports}
              paginatedReports={context.reports}
              goToPage={this.goToReportsPage}
              viewFormats={[FORMAT_CALENDAR, FORMAT_TABLE, FORMAT_SUMMARY]}
            />
          </div>
        )}
      </Context.Consumer>
    )
  }

  @autobind
  getReportMap(id) {
    return (
      <Context.Consumer>
        {context => (
          <div className="non-scrollable">
            <ContainerDimensions>
              {({ width, height }) => (
                <ReportCollection
                  width={width}
                  height={height}
                  marginBottom={0}
                  reports={context.allReports}
                  viewFormats={[FORMAT_MAP]}
                />
              )}
            </ContainerDimensions>
          </div>
        )}
      </Context.Consumer>
    )
  }

  render() {
    return (
      <Context.Provider value={this.state}>{super.render()}</Context.Provider>
    )
  }

  @autobind
  fetchChartData(chartQuery) {
    return Promise.all([chartQuery]).then(values => {
      // The server returns values from 1 to 7
      let daysOfWeekInt = [1, 2, 3, 4, 5, 6, 7]
      // The day of the week (returned by the server) with value 1 is Sunday
      let daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ]
      // Set the order in which to display the days of the week
      let displayOrderDaysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ]
      let graphData = []
      let reportsList = values[0].reportList.list || []
      if (reportsList.length) {
        let simplifiedValues = reportsList.map(d => {
          return { reportUuid: d.uuid, dayOfWeek: d.engagementDayOfWeek }
        })
        graphData = displayOrderDaysOfWeek.map(d => {
          let r = {}
          r.dayOfWeekInt = daysOfWeekInt[daysOfWeek.indexOf(d)]
          r.dayOfWeekString = d
          r.reportsCount = simplifiedValues.filter(
            item => item.dayOfWeek === r.dayOfWeekInt
          ).length
          return r
        })
      }
      this.setState({
        isLoading: false,
        updateChart: true, // update chart after fetching the data
        graphData: graphData
      })
    })
  }

  @autobind
  updateHighlight(focusedSelection, clear) {
    super.updateHighlight(
      focusedSelection ? focusedSelection.dayOfWeekInt : "",
      clear
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(ReportsByDayOfWeek)
