import API from "api"
import { gql } from "apollo-boost"
import autobind from "autobind-decorator"
import MosaicLayout from "components/MosaicLayout"
import * as d3 from "d3"
import _isEqual from "lodash/isEqual"
import PropTypes from "prop-types"
import React, { Component } from "react"

export const propTypes = {
  queryParams: PropTypes.object,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired,
  style: PropTypes.object
}

export default class ReportsVisualisation extends Component {
  get chartId() {
    return this.CHART_ID
  }

  get gqlChartFields() {
    return this.GQL_CHART_FIELDS
  }

  get visualizations() {
    return this.VISUALIZATIONS
  }

  get initialLayout() {
    return this.INITIAL_LAYOUT
  }

  get description() {
    return this.DESCRIPTION
  }

  get selectedBarClass() {
    return "selected-bar"
  }

  render() {
    return (
      <MosaicLayout
        style={this.props.style}
        visualizations={this.visualizations}
        initialNode={this.initialLayout}
        description={this.description}
      />
    )
  }

  fetchData() {
    this.setState({ isLoading: true })
    this.props.showLoading()
    Promise.all([
      // Query used by the chart
      this.fetchChartData(this.runChartQuery(this.chartQueryParams()))
    ]).then(() => this.props.hideLoading())
  }

  chartQueryParams = () => {
    const chartQueryParams = {}
    Object.assign(chartQueryParams, this.props.queryParams)
    Object.assign(chartQueryParams, {
      pageSize: 0 // retrieve all the filtered reports
    })
    return chartQueryParams
  }

  runChartQuery = chartQueryParams => {
    return API.query(
      gql`
        query($chartQueryParams: ReportSearchQueryInput) {
          reportList(query: $chartQueryParams) {
            totalCount
            list {
              ${this.gqlChartFields}
            }
          }
        }
      `,
      { chartQueryParams }
    )
  }

  getQueryParams = () => {
    const queryParams = {}
    Object.assign(queryParams, this.props.queryParams)
    if (this.state.focusedSelection) {
      Object.assign(queryParams, this.additionalReportParams)
    }
    return queryParams
  }

  @autobind
  goToSelection(item, chartId) {
    chartId = chartId || this.chartId
    this.updateHighlight(null, true, chartId)
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus.
    if (!item || item === this.state.focusedSelection) {
      this.setState({ updateChart: false, focusedSelection: "" })
    } else {
      this.setState({ updateChart: false, focusedSelection: item })
      this.updateHighlight(item, false, chartId)
    }
  }

  @autobind
  updateHighlight(focusedSelectionId, clear, chartId) {
    chartId = chartId || this.chartId
    if (clear) {
      // remove highlighting of the bars
      d3.selectAll("#" + chartId + " rect").classed(
        this.selectedBarClass,
        false
      )
    } else if (focusedSelectionId) {
      // highlight the bar corresponding to the selected day of the week
      d3.select("#" + chartId + " #bar_" + focusedSelectionId).classed(
        this.selectedBarClass,
        true
      )
    }
  }

  componentDidMount() {
    this.setState(
      {
        focusedSelection: "" // reset focus when changing the queryParams
      },
      () => this.fetchData()
    )
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.queryParams, this.props.queryParams)) {
      this.setState(
        {
          focusedSelection: "" // reset focus when changing the queryParams
        },
        () => this.fetchData()
      )
    }
  }

  @autobind
  showPopover(graphPopover, hoveredBar) {
    this.setState({ graphPopover, hoveredBar })
  }

  @autobind
  hidePopover() {
    this.setState({ graphPopover: null, hoveredBar: null })
  }
}
ReportsVisualisation.propTypes = propTypes
