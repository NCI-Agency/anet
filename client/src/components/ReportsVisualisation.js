import React, {Component} from 'react'
import PropTypes from 'prop-types'
import API from 'api'
import autobind from 'autobind-decorator'

import {GQL_REPORT_FIELDS} from 'components/ReportCollection'

import _isEqual from 'lodash/isEqual'

import MosaicLayout from 'components/MosaicLayout'

const d3 = require('d3')

const Context = React.createContext()

export const propTypes = {
  queryParams: PropTypes.object,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired,
  style: PropTypes.object,
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
    return 'selected-bar'
  }

  get gqlReportFields() {
    return GQL_REPORT_FIELDS
  }

  get gqlMapFields() {
    return /* GraphQL */`
      uuid
      intent
      location { uuid name lat lng }
    `
  }

  render() {
    return <MosaicLayout
        style={this.props.style}
        visualizations={this.visualizations}
        initialNode={this.initialLayout}
        description={this.description}
      />
  }

  fetchData() {
    this.setState({isLoading: true})
    this.props.showLoading()
    Promise.all([
      // Query used by the chart
      this.fetchChartData(this.runChartQuery(this.chartQueryParams())),
      this.fetchReportData(true)
    ]).then(() => this.props.hideLoading())
  }

  fetchReportData(includeAll) {
    // Query used by the reports collection
    const queries = [this.runReportsQuery(this.reportsQueryParams(false), false)]
    if (includeAll) {
      // Query used by the map
      queries.push(this.runReportsQuery(this.reportsQueryParams(true), true))
    }
    return Promise.all(queries).then(values => {
      const stateUpdate = {
        updateChart: false,  // only update the report list
        reports: values[0].reportList
      }
      if (includeAll) {
        Object.assign(stateUpdate, {
          allReports: values[1].reportList.list
        })
      }
      this.setState(stateUpdate)
    })
  }

  chartQueryParams = () => {
    const chartQueryParams = {}
    Object.assign(chartQueryParams, this.props.queryParams)
    Object.assign(chartQueryParams, {
      pageNum: 0,
      pageSize: 0,  // retrieve all the filtered reports
    })
    return chartQueryParams
  }

  runChartQuery = (chartQueryParams) => {
    return API.query(/* GraphQL */`
      reportList(query:$chartQueryParams) {
        totalCount, list {
          ${this.gqlChartFields}
        }
      }`, {chartQueryParams}, '($chartQueryParams: ReportSearchQueryInput)')
  }

  reportsQueryParams = (forMap) => {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: forMap ? 0 : this.state.reportsPageNum,
      pageSize: forMap ? 0 : 10
    })
    if (this.state.focusedSelection) {
      Object.assign(reportsQueryParams, this.additionalReportParams)
    }
    return reportsQueryParams
  }

  runReportsQuery = (reportsQueryParams, forMap) => {
    return API.query(/* GraphQL */`
      reportList(query:$reportsQueryParams) {
        pageNum, pageSize, totalCount, list {
          ${forMap ? this.gqlMapFields : this.gqlReportFields}
        }
      }`, {reportsQueryParams}, '($reportsQueryParams: ReportSearchQueryInput)')
  }

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchReportData(false))
  }

  @autobind
  goToSelection(item, chartId) {
    chartId = chartId || this.chartId
    this.updateHighlight(null, true, chartId)
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus.
    if (!item || item === this.state.focusedSelection) {
      this.setState({updateChart: false, reportsPageNum: 0, focusedSelection: ''}, () => this.fetchReportData(true))
    } else {
      this.setState({updateChart: false, reportsPageNum: 0, focusedSelection: item}, () => this.fetchReportData(true))
      this.updateHighlight(item, false, chartId)
    }
  }

  @autobind
  updateHighlight(focusedSelectionId, clear, chartId) {
    chartId = chartId || this.chartId
    if (clear) {
      // remove highlighting of the bars
      d3.selectAll('#' + chartId + ' rect').classed(this.selectedBarClass, false)
    } else if (focusedSelectionId) {
      // highlight the bar corresponding to the selected day of the week
      d3.select('#' + chartId + ' #bar_' + focusedSelectionId).classed(this.selectedBarClass, true)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.queryParams, this.props.queryParams)) {
      this.setState({
        reportsPageNum: 0,
        focusedSelection: ''  // reset focus when changing the queryParams
      }, () => this.fetchData())
    }
  }

}
