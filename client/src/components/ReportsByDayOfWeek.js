import React, {Component} from 'react'
import PropTypes from 'prop-types'
import API from 'api'
import autobind from 'autobind-decorator'
import {Button} from 'react-bootstrap'

import BarChart from 'components/BarChart'
import Fieldset from 'components/Fieldset'
import ReportCollection from 'components/ReportCollection'

import {Report} from 'models'

import _isEqual from 'lodash/isEqual'

import { connect } from 'react-redux'
import LoaderHOC, {mapDispatchToProps} from 'HOC/LoaderHOC'

const d3 = require('d3')
const chartByDayOfWeekId = 'reports_by_day_of_week'
const GQL_CHART_FIELDS =  /* GraphQL */`
  id
  engagementDayOfWeek
`
const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))

/*
 * Component displaying a chart with number of reports released within a certain
 * period. The counting is done grouped by day of the week. 
 */
class ReportsByDayOfWeek extends Component {
  static propTypes = {
    queryParams: PropTypes.object,
    showLoading: PropTypes.func.isRequired,
    hideLoading: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphDataByDayOfWeek: [],
      reportsPageNum: 0,
      focusedDayOfWeek: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  render() {
    const focusDetails = this.getFocusDetails()
    return (
      <div>
        <p className="help-text">{`Grouped by day of the week`}</p>
        <p className="chart-description">
          {`The reports are grouped by day of the week. In order to see the list
            of published reports for a day of the week, click on the bar
            corresponding to the day of the week.`}
        </p>
        <BarChartWithLoader
          chartId={chartByDayOfWeekId}
          data={this.state.graphDataByDayOfWeek}
          xProp='dayOfWeekInt'
          yProp='reportsCount'
          xLabel='dayOfWeekString'
          onBarClick={this.goToDayOfWeek}
          updateChart={this.state.updateChart}
          isLoading={this.state.isLoading}
        />
        <Fieldset
          title={`Reports by day of the week ${focusDetails.titleSuffix}`}
          id='cancelled-reports-details'
          action={!focusDetails.resetFnc
            ? '' : <Button onClick={() => this[focusDetails.resetFnc]()}>{focusDetails.resetButtonLabel}</Button>
          } >
          <ReportCollection paginatedReports={this.state.reports} goToPage={this.goToReportsPage} />
        </Fieldset>
      </div>
    )
  }

  getFocusDetails() {
    let titleSuffix = ''
    let resetFnc = ''
    let resetButtonLabel = ''
    if (this.state.focusedDayOfWeek) {
      titleSuffix = `for ${this.state.focusedDayOfWeek.dayOfWeekString}`
      resetFnc = 'goToDayOfWeek'
      resetButtonLabel = 'All days of the week'
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
    Promise.all([chartQuery]).then(values => {
      // The server returns values from 1 to 7
      let daysOfWeekInt = [1, 2, 3, 4, 5, 6, 7]
      // The day of the week (returned by the server) with value 1 is Sunday
      let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      // Set the order in which to display the days of the week
      let displayOrderDaysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      let simplifiedValues = values[0].reportList.list ?
          values[0].reportList.list.map(d => {return {reportId: d.id, dayOfWeek: d.engagementDayOfWeek}}) :
          []
      this.setState({
        isLoading: false,
        updateChart: true,  // update chart after fetching the data
        graphDataByDayOfWeek: displayOrderDaysOfWeek
          .map((d, i) => {
            let r = {}
            r.dayOfWeekInt = daysOfWeekInt[daysOfWeek.indexOf(d)]
            r.dayOfWeekString = d
            r.reportsCount = simplifiedValues.filter(item => item.dayOfWeek === r.dayOfWeekInt).length
            return r})
      })
      this.props.hideLoading()
    })
    this.fetchDayOfWeekData()
  }

  fetchDayOfWeekData() {
    // Query used by the reports collection
    const reportsQuery = this.runReportsQuery(this.reportsQueryParams())
    Promise.all([reportsQuery]).then(values => {
      this.setState({
        updateChart: false,  // only update the report list
        reports: values[0].reportList
      })
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
          ${GQL_CHART_FIELDS}
        }
      }`, {chartQueryParams}, '($chartQueryParams: ReportSearchQueryInput)')
  }

  reportsQueryParams = () => {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: this.state.reportsPageNum,
      pageSize: 10
    })
    if (this.state.focusedDayOfWeek) {
      Object.assign(reportsQueryParams, {engagementDayOfWeek: this.state.focusedDayOfWeek.dayOfWeekInt})
    }
    return reportsQueryParams
  }

  runReportsQuery = (reportsQueryParams) => {
    return API.query(/* GraphQL */`
      reportList(query:$reportsQueryParams) {
        pageNum, pageSize, totalCount, list {
          ${ReportCollection.GQL_REPORT_FIELDS}
        }
      }`, {reportsQueryParams}, '($reportsQueryParams: ReportSearchQueryInput)')
  }

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchDayOfWeekData())
  }

  resetChartSelection(chartId) {
    d3.selectAll('#' + chartId + ' rect').attr('class', '')
  }

  @autobind
  goToDayOfWeek(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus day of the week.
    this.setState({updateChart: false, reportsPageNum: 0, focusedDayOfWeek: item}, () => this.fetchDayOfWeekData())
    // remove highlighting of the bars
    this.resetChartSelection(chartByDayOfWeekId)
    if (item) {
      // highlight the bar corresponding to the selected day of the week
      d3.select('#' + chartByDayOfWeekId + ' #bar_' + item.dayOfWeekInt).attr('class', 'selected-bar')
    }
  }

  componentDidMount() {
    this.fetchData()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.queryParams, this.props.queryParams)) {
      this.setState({
        reportsPageNum: 0,
        focusedDayOfWeek: ''  // reset focus when changing the queryParams
      }, () => this.fetchData())
    }
  }

}

export default connect(null, mapDispatchToProps)(ReportsByDayOfWeek)
