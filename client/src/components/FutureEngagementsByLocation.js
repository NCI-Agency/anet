import { IconNames } from "@blueprintjs/icons"
import { Settings } from "api"
import autobind from "autobind-decorator"
import HorizontalBarChart from "components/HorizontalBarChart"
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
import moment from "moment"
import React from "react"
import { Overlay, Popover } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"

const d3 = require("d3")

const BarChartWithLoader = connect(
  null,
  mapDispatchToProps
)(LoaderHOC("isLoading")("data")(HorizontalBarChart))
const Context = React.createContext()

/*
 * Component displaying a chart with number of future engagements per date and
 * location. Locations are grouped per date.
 */
class FutureEngagementsByLocation extends ReportsVisualisation {
  static propTypes = { ...rvPropTypes }

  constructor(props) {
    super(props)

    this.CHART_ID = "future_engagements_by_location"
    this.GQL_CHART_FIELDS = /* GraphQL */ `
      uuid
      engagementDate
      location {
        uuid
        name
      }
    `
    this.VISUALIZATIONS = [
      {
        id: "febl-chart",
        icons: [IconNames.HORIZONTAL_BAR_CHART],
        title: "Chart by date and location",
        renderer: this.getBarChart
      },
      {
        id: "febl-collection",
        icons: [IconNames.PANEL_TABLE],
        title: "Reports by date and location",
        renderer: this.getReportCollection
      },
      {
        id: "febl-map",
        icons: [IconNames.MAP],
        title: "Map by date and location",
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
    this.DESCRIPTION = `The engagements are grouped first by date and within the date per location.
      In order to see the list of engagements for a date and location,
      click on the bar corresponding to the date and location.`

    this.state = {
      graphData: {},
      reports: null,
      allReports: null,
      reportsPageNum: 0,
      focusedSelection: "",
      graphPopover: null,
      hoveredBar: null,
      updateChart: true, // whether the chart needs to be updated
      isLoading: false
    }
  }

  get additionalReportParams() {
    const focusedDate = this.state.focusedSelection
      ? parseInt(this.state.focusedSelection.parentKey, 10)
      : ""
    const focusedLocation = this.state.focusedSelection
      ? this.state.focusedSelection.key
      : ""
    return {
      // Use here the start and end of a date in order to make sure the
      // fetch is independent of the engagementDate time value
      engagementDateStart: moment(focusedDate)
        .startOf("day")
        .valueOf(),
      engagementDateEnd: moment(focusedDate)
        .endOf("day")
        .valueOf(),
      locationUuid: focusedLocation
    }
  }

  get engagementDateRangeArray() {
    let dateArray = []
    let currentDate = moment(this.props.queryParams.engagementDateStart).clone()
    let endDate = moment(this.props.queryParams.engagementDateEnd)
    while (currentDate <= endDate) {
      dateArray.push(currentDate.clone())
      currentDate = currentDate.add(1, "days")
    }
    return dateArray
  }

  @autobind
  getBarChart(id) {
    return (
      <Context.Consumer>
        {context => (
          <div className="scrollable-y">
            <ContainerDimensions>
              {({ width }) => (
                <BarChartWithLoader
                  width={width}
                  chartId={this.chartId}
                  data={context.graphData}
                  onBarClick={this.goToSelection}
                  showPopover={this.showPopover}
                  hidePopover={this.hidePopover}
                  updateChart={context.updateChart}
                  selectedBarClass={this.selectedBarClass}
                  selectedBar={
                    context.focusedSelection
                      ? "bar_" +
                        context.focusedSelection.key +
                        context.focusedSelection.parentKey
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
                title={
                  context.hoveredBar &&
                  context.graphData.categoryLabels[context.hoveredBar.parentKey]
                }
              >
                <p style={{ textAlign: "center" }}>
                  {context.hoveredBar &&
                    `${
                      context.graphData.leavesLabels[context.hoveredBar.key]
                    }: ${context.hoveredBar.value}`}
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
        {context =>
          context.allReports === null ? null : (
            <div className="scrollable">
              <ReportCollection
                reports={context.allReports}
                paginatedReports={context.reports}
                goToPage={this.goToReportsPage}
                viewFormats={[FORMAT_CALENDAR, FORMAT_TABLE, FORMAT_SUMMARY]}
              />
            </div>
          )
        }
      </Context.Consumer>
    )
  }

  @autobind
  getReportMap(id) {
    return (
      <Context.Consumer>
        {context =>
          context.allReports === null ? null : (
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
          )
        }
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
      const noLocation = {
        uuid: "-1",
        name: "No location allocated"
      }
      let graphData = {}
      let reportsList = values[0].reportList.list || []
      if (reportsList.length) {
        reportsList = reportsList.map(d => {
          if (!d.location) d.location = noLocation
          return d
        })
        // add days without data as we want to display them in the chart
        let allCategories = this.engagementDateRangeArray.map(function(d) {
          return {
            key: d.valueOf(),
            values: [{}]
          }
        })
        let categoriesWithData = d3
          .nest()
          .key(function(d) {
            return moment(d.engagementDate)
              .startOf("day")
              .valueOf()
          })
          .key(function(d) {
            return d.location.uuid
          })
          .rollup(function(leaves) {
            return leaves.length
          })
          .entries(reportsList)
        let groupedData = allCategories.map(d => {
          let categData = categoriesWithData.find(x => {
            return Number(x.key) === d.key
          })
          return Object.assign({}, d, categData)
        })
        graphData.data = groupedData
        graphData.categoryLabels = allCategories.reduce(function(prev, curr) {
          prev[curr.key] = moment(curr.key).format(
            Settings.dateFormats.forms.displayShort.date
          )
          return prev
        }, {})
        graphData.leavesLabels = reportsList.reduce(function(prev, curr) {
          prev[curr.location.uuid] = curr.location.name
          return prev
        }, {})
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
      focusedSelection ? focusedSelection.key + focusedSelection.parentKey : "",
      clear
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(FutureEngagementsByLocation)
