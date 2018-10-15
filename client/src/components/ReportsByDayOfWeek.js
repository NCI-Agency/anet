import React, {Component} from 'react'
import PropTypes from 'prop-types'
import API from 'api'
import autobind from 'autobind-decorator'

import BarChart from 'components/BarChart'
import ReportCollection, {FORMAT_MAP, FORMAT_SUMMARY, FORMAT_TABLE} from 'components/ReportCollection'

import {Report} from 'models'

import _isEqual from 'lodash/isEqual'

import { connect } from 'react-redux'
import LoaderHOC, {mapDispatchToProps} from 'HOC/LoaderHOC'

import ContainerDimensions from 'react-container-dimensions'
import MosaicLayout from 'components/MosaicLayout'

const d3 = require('d3')
const chartId = 'reports_by_day_of_week'
const GQL_CHART_FIELDS =  /* GraphQL */`
  uuid
  engagementDayOfWeek
`
const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))

const GQL_MAP_FIELDS =  /* GraphQL */`
  uuid
  intent
  location { uuid, name, lat, lng },
`

const Context = React.createContext()

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
    this.VISUALIZATIONS = [
      {
        id: 'rbdow-chart',
        title: 'Chart by day of the week',
        renderer: this.getBarChart,
      },
      {
        id: 'rbdow-collection',
        title: 'Reports by day of the week',
        renderer: this.getReportCollection,
      },
      {
        id: 'rbdow-map',
        title: 'Map by day of the week',
        renderer: this.getReportMap,
      },
    ]
    this.INITIAL_NODE = {
      direction: 'column',
      first: {
        direction: 'row',
        first: this.VISUALIZATIONS[0].id,
        second: this.VISUALIZATIONS[1].id,
      },
      second: this.VISUALIZATIONS[2].id,
    }
    this.SELECTED_BAR_CLASS = 'selected-bar'

    this.state = {
      graphData: [],
      reports: {},
      allReports: [],
      reportsPageNum: 0,
      focusedSelection: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  @autobind
  getBarChart(id) {
    return <Context.Consumer>{context => (
      <div className="non-scrollable">
        <ContainerDimensions>{({width, height}) => (
          <BarChartWithLoader
            width={width}
            height={height}
            chartId={chartId}
            data={context.graphData}
            xProp='dayOfWeekInt'
            yProp='reportsCount'
            xLabel='dayOfWeekString'
            onBarClick={this.goToSelection}
            updateChart={context.updateChart}
            selectedBarClass={this.SELECTED_BAR_CLASS}
            selectedBar={context.focusedSelection ? 'bar_' + context.focusedSelection.dayOfWeekInt : ''}
            isLoading={context.isLoading}
          />
        )}</ContainerDimensions>
      </div>
    )}</Context.Consumer>
  }

  @autobind
  getReportCollection(id)
  {
    return <Context.Consumer>{context => (
      <div className="scrollable">
        <ReportCollection
          paginatedReports={context.reports}
          goToPage={this.goToReportsPage}
          viewFormats={[FORMAT_SUMMARY, FORMAT_TABLE]}
        />
      </div>
    )}</Context.Consumer>
  }

  @autobind
  getReportMap(id)
  {
    return <Context.Consumer>{context => (
      <div className="non-scrollable">
        <ContainerDimensions>{({width, height}) => (
          <ReportCollection
            width={width}
            height={height}
            marginBottom={0}
            reports={context.allReports}
            viewFormats={[FORMAT_MAP]}
          />
        )}</ContainerDimensions>
      </div>
    )}</Context.Consumer>
  }

  render() {
    return <Context.Provider value={this.state}>
      <MosaicLayout
        visualizations={this.VISUALIZATIONS}
        initialNode={this.INITIAL_NODE}
        description={`The reports are grouped by day of the week. In order to see the list
                      of published reports for a day of the week, click on the bar
                      corresponding to the day of the week.`}
      />
    </Context.Provider>
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
          values[0].reportList.list.map(d => {return {reportUuid: d.uuid, dayOfWeek: d.engagementDayOfWeek}}) :
          []
      this.setState({
        isLoading: false,
        updateChart: true,  // update chart after fetching the data
        graphData: displayOrderDaysOfWeek
          .map(d => {
            let r = {}
            r.dayOfWeekInt = daysOfWeekInt[daysOfWeek.indexOf(d)]
            r.dayOfWeekString = d
            r.reportsCount = simplifiedValues.filter(item => item.dayOfWeek === r.dayOfWeekInt).length
            return r})
      })
      this.props.hideLoading()
    })
    this.fetchReportData(true)
  }

  fetchReportData(includeAll) {
    // Query used by the reports collection
    const queries = [this.runReportsQuery(this.reportsQueryParams(false), false)]
    if (includeAll) {
      // Query used by the map
      queries.push(this.runReportsQuery(this.reportsQueryParams(true), true))
    }
    Promise.all(queries).then(values => {
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
          ${GQL_CHART_FIELDS}
        }
      }`, {chartQueryParams}, '($chartQueryParams: ReportSearchQueryInput)')
  }

  reportsQueryParams = (forMap) => {
    const pageSize = forMap ? 0 : 10
    const pageNum = forMap ? 0 : this.state.reportsPageNum
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum,
      pageSize
    })
    if (this.state.focusedSelection) {
      Object.assign(reportsQueryParams, {engagementDayOfWeek: this.state.focusedSelection.dayOfWeekInt})
    }
    return reportsQueryParams
  }

  runReportsQuery = (reportsQueryParams, forMap) => {
    return API.query(/* GraphQL */`
      reportList(query:$reportsQueryParams) {
        pageNum, pageSize, totalCount, list {
          ${forMap ? GQL_MAP_FIELDS : ReportCollection.GQL_REPORT_FIELDS}
        }
      }`, {reportsQueryParams}, '($reportsQueryParams: ReportSearchQueryInput)')
  }

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchReportData(false))
  }

  @autobind
  goToSelection(item) {
    this.updateHighlight(item, true)
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus.
    if (!item || item === this.state.focusedSelection) {
      this.setState({updateChart: false, reportsPageNum: 0, focusedSelection: ''}, () => this.fetchReportData(true))
    } else {
      this.setState({updateChart: false, reportsPageNum: 0, focusedSelection: item}, () => this.fetchReportData(true))
      this.updateHighlight(item, false)
    }
  }

  updateHighlight(focusedSelection, clear) {
    if (clear) {
      // remove highlighting of the bars
      d3.selectAll('#' + chartId + ' rect').classed(this.SELECTED_BAR_CLASS, false)
    } else if (focusedSelection) {
      // highlight the bar corresponding to the selected day of the week
      d3.select('#' + chartId + ' #bar_' + focusedSelection.dayOfWeekInt).classed(this.SELECTED_BAR_CLASS, true)
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

export default connect(null, mapDispatchToProps)(ReportsByDayOfWeek)
