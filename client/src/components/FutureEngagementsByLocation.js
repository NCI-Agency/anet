import React, {Component} from 'react'
import PropTypes from 'prop-types'
import API from 'api'
import autobind from 'autobind-decorator'
import {Button} from 'react-bootstrap'

import HorizontalBarChart from 'components/HorizontalBarChart'
import Fieldset from 'components/Fieldset'
import ReportCollection from 'components/ReportCollection'
import moment from 'moment'

const d3 = require('d3')
const colors = {
  barColor: '#F5CA8D',
  selectedBarColor: '#EC971F'
}
const chartByPoamId = 'future_engagements_by_location'


/*
 * Component displaying a chart with number of reports per PoAM.
 */
export default class FutureEngagementsByLocation extends Component {
  static propTypes = {
    startDate: PropTypes.object.isRequired,
    endDate: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphDataByPoam: null,
      focusedPoam: '',
      updateChart: true,  // whether the chart needs to be updated
      useDefaultDates: true,
    }
  }

  get startDate() {
    const defaultStartDate = moment().startOf('day')
    return (this.state.useDefaultDates) ? defaultStartDate : this.props.startDate
  }

  get endDate() {
    const defaultEndDate = moment().add(14, 'days')
    return (this.state.useDefaultDates) ? defaultEndDate : this.props.endDate
  }

  get queryParams() {
    return {
      releasedAtStart: this.startDate.valueOf(),
      releasedAtEnd: this.endDate.valueOf(),
    }
  }

  render() {
    let chartByPoam = ''
    if (this.state.graphDataByPoam) {
      chartByPoam = <HorizontalBarChart
        chartId={chartByPoamId}
        data={this.state.graphDataByPoam}
        onBarClick={this.goToPoam}
        barColor={colors.barColor}
        updateChart={this.state.updateChart}
      />
    }
    let focusDetails = this.getFocusDetails()
    return (
      <div>
        {chartByPoam}
        <Fieldset
            title={`Reports by PoAM ${focusDetails.titleSuffix}`}
            id='cancelled-reports-details'
            action={!focusDetails.resetFnc
              ? '' : <Button onClick={() => this[focusDetails.resetFnc]()}>{focusDetails.resetButtonLabel}</Button>
            }
          >
          <ReportCollection paginatedReports={this.state.reports} goToPage={this.goToReportsPage} />
        </Fieldset>
      </div>
    )
  }

  getFocusDetails() {
    let titleSuffix = ''
    let resetFnc = ''
    let resetButtonLabel = ''
    if (this.state.focusedPoam) {
      titleSuffix = `for ${this.state.focusedPoam.shortName}`
      resetFnc = 'goToPoam'
      resetButtonLabel = 'All PoAMs'
    }
    return {
      titleSuffix: titleSuffix,
      resetFnc: resetFnc,
      resetButtonLabel: resetButtonLabel
    }
  }

  fetchData() {
    const chartQueryParams = {}
    Object.assign(chartQueryParams, this.queryParams)
    Object.assign(chartQueryParams, {
      pageSize: 0,  // retrieve all the filtered reports
    })
    // Query used by the chart
    let chartQuery = API.query(/* GraphQL */`
        reportList(f:search, query:$chartQueryParams) {
          totalCount, list {
            ${ReportCollection.GQL_REPORT_FIELDS}
          }
        }
      `, {chartQueryParams}, '($chartQueryParams: ReportSearchQuery)')
    Promise.all([chartQuery]).then(values => {
      let reportsList = values[0].reportList.list
      let groupedData = d3.nest()
        .key(function(d) { return d.engagementDate })
        .key(function(d) { return d.location.id })
        .rollup(function(leaves) { return leaves.length })
        .entries(reportsList)
      let graphData = {}
      graphData.data = groupedData
      graphData.categoryLabels = reportsList.reduce(
        function(prev, curr) {
          prev[curr.engagementDate] = moment(curr.engagementDate).format('D MMM YYYY')
          return prev
        },
        {}
      )
      graphData.leavesLabels = reportsList.reduce(
        function(prev, curr) {
          prev[curr.location.id] = curr.location.name
          return prev
        },
        {}
      )
      this.setState({
        updateChart: true,  // update chart after fetching the data
        graphDataByPoam: graphData
      })
    })
    this.fetchPoamData()
  }

  fetchPoamData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.queryParams)
    Object.assign(reportsQueryParams, {pageNum: this.state.reportsPageNum})
    if (this.state.focusedPoam) {
      Object.assign(reportsQueryParams, {poamId: this.state.focusedPoam.id})
    }
    // Query used by the reports collection
    let reportsQuery = API.query(/* GraphQL */`
        reportList(f:search, query:$reportsQueryParams) {
          pageNum, pageSize, totalCount, list {
            ${ReportCollection.GQL_REPORT_FIELDS}
          }
        }
      `, {reportsQueryParams}, '($reportsQueryParams: ReportSearchQuery)')
    Promise.all([reportsQuery]).then(values => {
      this.setState({
        updateChart: false,  // only update the report list
        reports: values[0].reportList
      })
    })
  }

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchPoamData())
  }

  resetChartSelection(chartId) {
    d3.selectAll('#' + chartId + ' rect').attr('fill', colors.barColor)
  }

  @autobind
  goToPoam(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus poam.
    this.setState({updateChart: false, reportsPageNum: 0, focusedPoam: (item ? item.poam : '')}, () => this.fetchPoamData())
    // remove highlighting of the bars
    this.resetChartSelection(chartByPoamId)
    if (item) {
      // highlight the bar corresponding to the selected poam
      d3.select('#' + chartByPoamId + ' #bar_' + item.poam.id).attr('fill', colors.selectedBarColor)
    }
  }

  componentDidMount() {
    this.fetchData()
    if (this.state.useDefaultDates) {
      this.setState({ useDefaultDates: false })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const startDateChanged = prevProps.startDate.valueOf() !== this.props.startDate.valueOf()
    const endDateChanged = prevProps.endDate.valueOf() !== this.props.endDate.valueOf()

    if (startDateChanged || endDateChanged) {
      this.fetchData()
    }
  }
}
