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
const chartId = 'future_engagements_by_location'


/*
 * Component displaying a chart with number of future engagements per date and
 * location. Locations are grouper per date.
 */
export default class FutureEngagementsByLocation extends Component {
  static propTypes = {
    startDate: PropTypes.object.isRequired,
    endDate: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphData: null,
      focusedDate: '',
      focusedLocation: '',
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
    let chart = ''
    if (this.state.graphData) {
      chart = <HorizontalBarChart
        chartId={chartId}
        data={this.state.graphData}
        onBarClick={this.goToSelection}
        barColor={colors.barColor}
        updateChart={this.state.updateChart}
      />
    }
    let focusDetails = this.getFocusDetails()
    return (
      <div>
        {chart}
        <Fieldset
            title={`Future Engagements ${focusDetails.titleSuffix}`}
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
    if (this.state.focusedLocation && this.state.focusedDate) {
      titleSuffix = `for ${this.state.focusedLocation.label} on ${this.state.focusedDate}`
      resetFnc = 'goToSelection'
      resetButtonLabel = 'All locations'
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
        .key(function(d) { return new Date(d.engagementDate) })
        .key(function(d) { return d.location.id })
        .rollup(function(leaves) { return leaves.length })
        .entries(reportsList)
      let graphData = {}
      graphData.data = groupedData
      graphData.categoryLabels = groupedData.reduce(
        function(prev, curr) {
          prev[curr.key] = moment(curr.key).format('D MMM YYYY')
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
        graphData: graphData
      })
    })
    this.fetchFocusData()
  }

  fetchFocusData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.queryParams)
    Object.assign(reportsQueryParams, {pageNum: this.state.reportsPageNum})
    if (this.state.focusedDate) {
      Object.assign(reportsQueryParams, {
        // TODO: Use here the start and end of a date in order to make sure the
        // fetch is independen of the engagementDate time value
        engagementDateStart: moment(this.state.focusedDate).valueOf(),
        engagementDateEnd: moment(this.state.focusedDate).valueOf()
      })
    }
    if (this.state.focusedLocation) {
      Object.assign(reportsQueryParams, {
        locationId: this.state.focusedLocation.key
      })
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
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchFocusData())
  }

  resetChartSelection(chartId) {
    d3.selectAll('#' + chartId + ' rect').attr('fill', colors.barColor)
  }

  @autobind
  goToSelection(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus bar
    this.setState(
      {
        updateChart: false,
        reportsPageNum: 0,
        focusedDate: (item ? item.parentKey : ''),
        focusedLocation: (item ? {key: item.key, label: this.state.graphData.leavesLabels[item.key]} : '')
      },
      () => this.fetchFocusData()
    )
    // remove highlighting of the bars
    this.resetChartSelection(chartId)
    if (item) {
      // highlight the selected bar
      d3.select('#' + chartId + ' #bar_' + item.key + item.parentKey).attr('fill', colors.selectedBarColor)
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
