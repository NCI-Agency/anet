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
import { createBalancedTreeFromLeaves, getLeaves, getNodeAtPath, getOtherDirection, getPathToCorner, updateTree,
	Corner, Mosaic, MosaicWindow } from 'react-mosaic-component'
import { Classes } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import classNames from 'classnames'
import _dropRight from 'lodash/dropRight'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import 'react-mosaic-component/react-mosaic-component.css'
import 'pages/insights/mosaic.css'

const d3 = require('d3')
const chartByDayOfWeekId = 'reports_by_day_of_week'
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
    this.VISUALIZATIONS = {
      'rbdow-chart': {
        title: 'Chart by day of the week',
        renderer: this.getBarChart,
      },
      'rbdow-collection': {
        title: 'Reports by day of the week',
        renderer: this.getReportCollection,
      },
      'rbdow-map': {
        title: 'Map by day of the week',
        renderer: this.getReportMap,
      },
    }
    this.SELECTED_BAR_CLASS = 'selected-bar'

    this.state = {
      currentNode: {
        direction: 'column',
        first: {
          direction: 'row',
          first: Object.keys(this.VISUALIZATIONS)[0],
          second: Object.keys(this.VISUALIZATIONS)[1],
        },
        second: Object.keys(this.VISUALIZATIONS)[2],
      },
      graphDataByDayOfWeek: [],
      reportsPageNum: 0,
      focusedDayOfWeek: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  @autobind
  getBarChart(id) {
    return <div className="non-scrollable">
      <ContainerDimensions>{({width, height}) => { return (
        <BarChartWithLoader
          width={width}
          height={height}
          chartId={chartByDayOfWeekId}
          data={this.state.graphDataByDayOfWeek}
          xProp='dayOfWeekInt'
          yProp='reportsCount'
          xLabel='dayOfWeekString'
          onBarClick={this.goToDayOfWeek}
          updateChart={this.state.updateChart}
          selectedBarClass={this.SELECTED_BAR_CLASS}
          selectedBar={this.state.focusedDayOfWeek ? 'bar_' + this.state.focusedDayOfWeek.dayOfWeekInt : ''}
          isLoading={this.state.isLoading}
        />)}
      }</ContainerDimensions>
    </div>
  }

  @autobind
  getReportCollection(id)
  {
    const focusDetails = this.getFocusDetails()
    return <div className="scrollable">
      <ReportCollection
        paginatedReports={this.state.reports}
        goToPage={this.goToReportsPage}
        viewFormats={[FORMAT_SUMMARY, FORMAT_TABLE]}
      />
    </div>
  }

  @autobind
  getReportMap(id)
  {
    const focusDetails = this.getFocusDetails()
    return <div className="non-scrollable">
      <ContainerDimensions>{({width, height}) => { return (
        <ReportCollection
          width={width}
          height={height}
          marginBottom={0}
          reports={this.state.allReports}
          viewFormats={[FORMAT_MAP]}
        />)}
      }</ContainerDimensions>
    </div>
  }

  render() {
    return <div>
      <p className="chart-description">
        {`The reports are grouped by day of the week. In order to see the list
          of published reports for a day of the week, click on the bar
          corresponding to the day of the week.`}
      </p>
      {this.renderNavBar()}
      <div id="insightContainer">
      <Mosaic
        value={this.state.currentNode}
        onChange={this.updateCurrentNode}
        renderTile={(id, path) => (
          <MosaicWindow
            title={this.VISUALIZATIONS[id].title}
            path={path}
            {...this.state}>
            {this.VISUALIZATIONS[id].renderer(id)}
          </MosaicWindow>
        )}
      />
      </div>
    </div>
  }

  @autobind
  updateCurrentNode(currentNode) {
    this.setState({ currentNode })
  }

  @autobind
  renderNavBar() {
    return (
      <div className={classNames(Classes.NAVBAR)}>
        <div className={classNames(Classes.NAVBAR_GROUP, Classes.BUTTON_GROUP)}>
          <span className="actions-label">Actions:</span>
          <button
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.GRID_VIEW))}
            onClick={this.autoArrange}
          >
            Auto Arrange
          </button>
          {this.renderChartButtons()}
        </div>
      </div>
    )
  }

  renderChartButtons() {
    const buttons = []
    const leaves = getLeaves(this.state.currentNode)
    Object.forEach(this.VISUALIZATIONS, viz => {
      if (!leaves.includes(viz)) {
        buttons.push(
          <button
            key={viz}
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.ARROW_TOP_RIGHT))}
            onClick={this.addChart.bind(this, viz)}
          >
            {this.VISUALIZATIONS[viz].title}
          </button>
        )
      }
    })
    return buttons
  }

  autoArrange = () => {
    const leaves = getLeaves(this.state.currentNode)
    this.updateCurrentNode(createBalancedTreeFromLeaves(leaves))
  }

  addChart = (viz) => {
    let { currentNode } = this.state
    if (!currentNode) {
     currentNode = viz
    } else {
      const path = getPathToCorner(currentNode, Corner.TOP_RIGHT)
      const parent = getNodeAtPath(currentNode, _dropRight(path))
      const destination = getNodeAtPath(currentNode, path)
      const direction = parent ? getOtherDirection(parent.direction) : 'row'
      let first
      let second
      if (direction === 'row') {
        first = destination
        second = viz
      } else {
        first = viz
        second = destination
      }
      currentNode = updateTree(currentNode, [
        {
          path,
          spec: {
            $set: {
              direction,
              first,
              second,
            },
          },
        },
      ])
    }
    this.updateCurrentNode(currentNode)
  }

  getFocusDetails() {
    let titleSuffix = 'all days of the week'
    let resetFnc = ''
    let resetButtonLabel = ''
    if (this.state.focusedDayOfWeek) {
      titleSuffix = this.state.focusedDayOfWeek.dayOfWeekString
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
          values[0].reportList.list.map(d => {return {reportUuid: d.uuid, dayOfWeek: d.engagementDayOfWeek}}) :
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
    const allReportsQuery = this.runReportsQuery(this.reportsQueryParams(0))
    Promise.all([reportsQuery, allReportsQuery]).then(values => {
      this.setState({
        updateChart: false,  // only update the report list
        reports: values[0].reportList,
        allReports: values[1].reportList.list
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

  reportsQueryParams = (pageSize) => {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: this.state.reportsPageNum,
      pageSize: (pageSize === undefined) ? 10 : pageSize
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

  @autobind
  goToDayOfWeek(item) {
    this.updateDayOfWeekHighlight(item, true)
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus day of the week.
    if (!item || item === this.state.focusedDayOfWeek) {
      this.setState({updateChart: false, reportsPageNum: 0, focusedDayOfWeek: ''}, () => this.fetchDayOfWeekData())
    } else {
      this.setState({updateChart: false, reportsPageNum: 0, focusedDayOfWeek: item}, () => this.fetchDayOfWeekData())
      this.updateDayOfWeekHighlight(item, false)
    }
  }

  updateDayOfWeekHighlight(focusedDayOfWeek, clear) {
    if (clear) {
      // remove highlighting of the bars
      d3.selectAll('#' + chartByDayOfWeekId + ' rect').classed(this.SELECTED_BAR_CLASS, false)
    } else if (focusedDayOfWeek) {
      // highlight the bar corresponding to the selected day of the week
      d3.select('#' + chartByDayOfWeekId + ' #bar_' + focusedDayOfWeek.dayOfWeekInt).classed(this.SELECTED_BAR_CLASS, true)
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
