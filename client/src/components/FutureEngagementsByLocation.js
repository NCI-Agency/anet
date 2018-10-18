import React, {Component} from 'react'
import PropTypes from 'prop-types'
import API from 'api'
import autobind from 'autobind-decorator'
import {Button} from 'react-bootstrap'

import HorizontalBarChart from 'components/HorizontalBarChart'
import Fieldset from 'components/Fieldset'
import ReportCollection from 'components/ReportCollection'
import moment from 'moment'

import _isEqual from 'lodash/isEqual'

import { connect } from 'react-redux'
import LoaderHOC, {mapDispatchToProps} from 'HOC/LoaderHOC'

const d3 = require('d3')
const chartId = 'future_engagements_by_location'
const GQL_CHART_FIELDS =  /* GraphQL */`
  id
  engagementDate
  location { id, name }
`
const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(HorizontalBarChart))

/*
 * Component displaying a chart with number of future engagements per date and
 * location. Locations are grouped per date.
 */
class FutureEngagementsByLocation extends Component {
  static propTypes = {
    queryParams: PropTypes.object,
    showLoading: PropTypes.func.isRequired,
    hideLoading: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphData: {},
      reportsPageNum: 0,
      focusedDate: '',
      focusedLocation: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  get engagementDateRangeArray() {
    let dateArray = []
    let currentDate = moment(this.props.queryParams.engagementDateStart).clone()
    let endDate = moment(this.props.queryParams.engagementDateEnd)
    while (currentDate <= endDate) {
      dateArray.push(currentDate.clone())
      currentDate = currentDate.add(1, 'days')
    }
    return dateArray
  }

  render() {
    const focusDetails = this.getFocusDetails()
    return (
      <div>
        <p className="help-text">{`Grouped by date and location`}</p>
        <p className="chart-description">
          {`The engagements are grouped first by date and within the date per
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
    this.props.showLoading()
    // Query used by the chart
    const chartQuery = this.runChartQuery(this.chartQueryParams())
    const noLocation = {
      id: -1,
      name: 'No location allocated'
    }
    Promise.all([chartQuery]).then(values => {
      let reportsList = values[0].reportList.list || []
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
        let categData = categoriesWithData.find((x) => {return Number(x.key) === d.key })
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
      this.props.hideLoading()
    })
    this.fetchFocusData()
  }

  fetchFocusData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
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
        reportList(query:$reportsQueryParams) {
          pageNum, pageSize, totalCount, list {
            ${ReportCollection.GQL_REPORT_FIELDS}
          }
        }
      `, {reportsQueryParams}, '($reportsQueryParams: ReportSearchQueryInput)')
    Promise.all([reportsQuery]).then(values => {
      this.setState({
        updateChart: false,  // only update the report list
        reports: values[0].reportList
      })
    })
  }

  chartQueryParams = () => {
    const chartQueryParams = {}
    const queryParams = this.props.queryParams
    Object.assign(chartQueryParams, queryParams)
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
        ${GQL_CHART_FIELDS}
      }
    }
  `, {chartQueryParams}, '($chartQueryParams: ReportSearchQueryInput)')
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

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.queryParams, this.props.queryParams)) {
      this.setState({
        reportsPageNum: 0,
        focusedDate: '',  // reset focus when changing the queryParams
        focusedLocation: ''
      }, () => this.fetchData())
    }
  }

}

export default connect(null, mapDispatchToProps)(FutureEngagementsByLocation)
