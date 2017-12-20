import React, {Component} from 'react'
import PropTypes from 'prop-types'
import API from 'api'
import autobind from 'autobind-decorator'
import {Button} from 'react-bootstrap'

import HorizontalBarChart from 'components/HorizontalBarChart'
import Fieldset from 'components/Fieldset'
import ReportCollection from 'components/ReportCollection'
import moment from 'moment'

import LoaderHOC from '../HOC/LoaderHOC'

const d3 = require('d3')
const chartId = 'future_engagements_by_location'

const BarChartWithLoader = LoaderHOC('isLoading')('data')(HorizontalBarChart)


/*
 * Component displaying a chart with number of future engagements per date and
 * location. Locations are grouped per date.
 */
export default class FutureEngagementsByLocation extends Component {
  static propTypes = {
    startDate: PropTypes.object.isRequired,
    endDate: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphData: {},
      focusedDate: '',
      focusedLocation: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  get queryParams() {
    return {
      engagementDateStart: this.props.startDate.clone().startOf('day').valueOf(),
      engagementDateEnd: this.props.endDate.valueOf(),
    }
  }

  get engagementDateRangeArray() {
    let dateArray = []
    let currentDate = this.props.startDate.clone()
    let endDate = this.props.endDate
    while (currentDate <= endDate) {
      dateArray.push(currentDate.clone().startOf('day'))
      currentDate = currentDate.add(1, 'days')
    }
    return dateArray
  }

  get startDateLongStr() { return this.props.startDate.format('DD MMM YYYY') }

  get endDateLongStr() { return this.props.endDate.format('DD MMM YYYY') }

  render() {
    const focusDetails = this.getFocusDetails()
    return (
      <div>
        <p className="help-text">{`Number of engagements between ${this.startDateLongStr} and ${this.endDateLongStr}, grouped by date and location`}</p>
        <p className="chart-description">
          {`Displays the number of engagements which have an engagement date
            between ${this.startDateLongStr} and ${this.endDateLongStr}.
            The engagements are grouped first by date and within the date per
            location. In order to see the list of engagements for a date and
            location, click on the bar corresponding to the date and location.`}
        </p>
        <BarChartWithLoader
          chartId={chartId}
          data={this.state.graphData}
          onBarClick={this.goToSelection}
          updateChart={this.state.updateChart}
          isLoading={this.state.isLoading}
        />
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
    const focusDate = moment(this.state.focusedDate).format('D MMM YYYY')
    if (this.state.focusedLocation && this.state.focusedDate) {
      titleSuffix = `for ${this.state.focusedLocation.label} on ${focusDate}`
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
    this.setState( {isLoading: true} )
    // Query used by the chart
    const chartQuery = this.runChartQuery(this.chartQueryParams())
    const noLocation = {
      id: -1,
      name: 'No location allocated'
    }
    Promise.all([chartQuery]).then(values => {
      let reportsList = values[0].reportList.list
      reportsList = reportsList
        .map(d => { if (!d.location) d.location = noLocation; return d })
      // add days without data as we want to display them in the chart
      let allCategories = this.engagementDateRangeArray.map(function(d) {
        return {
          key: d.valueOf(),
          values: [{}]
        }
      })
      let categoriesWithData = d3.nest()
        .key(function(d) { return moment(d.engagementDate).startOf('day').valueOf() })
        .key(function(d) { return d.location.id })
        .rollup(function(leaves) { return leaves.length })
        .entries(reportsList)
      let groupedData = allCategories.map((d)=> {
        let categData = categoriesWithData.find((x) => { return x.key == d.key })
        return Object.assign({}, d, categData)
      })
      let graphData = {}
      graphData.data = groupedData
      graphData.categoryLabels = allCategories.reduce(
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
        graphData: graphData,
        isLoading: false
      })
    })
    this.fetchFocusData()

  }

  fetchFocusData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: this.state.reportsPageNum,
      pageSize: 10
    })
    if (this.state.focusedDate) {
      Object.assign(reportsQueryParams, {
        // Use here the start and end of a date in order to make sure the
        // fetch is independent of the engagementDate time value
        engagementDateStart: moment(this.state.focusedDate).startOf('day').valueOf(),
        engagementDateEnd: moment(this.state.focusedDate).endOf('day').valueOf(),
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

  chartQueryParams = () => {
    const chartQueryParams = {}
    const queryParams = this.queryParams
    Object.assign(chartQueryParams, queryParams)
    Object.assign(chartQueryParams, {
      pageSize: 0,  // retrieve all the filtered reports
    })
    return chartQueryParams
  }

  runChartQuery = (chartQueryParams) => {
    return API.query(/* GraphQL */`
    reportList(f:search, query:$chartQueryParams) {
      totalCount, list {
        ${ReportCollection.GQL_REPORT_FIELDS}
      }
    }
  `, {chartQueryParams}, '($chartQueryParams: ReportSearchQuery)')
  }

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchFocusData())
  }

  resetChartSelection(chartId) {
    d3.selectAll('#' + chartId + ' rect').attr('class', '')
  }

  @autobind
  goToSelection(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus bar
    this.setState(
      {
        updateChart: false,
        reportsPageNum: 0,
        focusedDate: (item ? parseInt(item.parentKey, 10) : ''),
        focusedLocation: (item ? {key: item.key, label: this.state.graphData.leavesLabels[item.key]} : '')
      },
      () => this.fetchFocusData()
    )
    // remove highlighting of the bars
    this.resetChartSelection(chartId)
    if (item) {
      // highlight the selected bar
      d3.select('#' + chartId + ' #bar_' + item.key + item.parentKey).attr('class', 'selected-bar')
    }
  }

  componentDidMount() {
    this.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (this.datePropsChanged(nextProps)) {
      this.setState({
        reportsPageNum: 0,
        focusedDate: '',
        focusedLocation: ''
      })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.datePropsChanged(prevProps)) {
      this.fetchData()
    }
  }

  datePropsChanged(otherProps) {
    const startDateChanged = otherProps.startDate.valueOf() !== this.props.startDate.valueOf()
    const endDateChanged = otherProps.endDate.valueOf() !== this.props.endDate.valueOf()
    return startDateChanged || endDateChanged
  }
}
