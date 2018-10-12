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
import Settings from 'Settings'

import ContainerDimensions from 'react-container-dimensions'
import MosaicLayout from 'components/MosaicLayout'

import pluralize from 'pluralize'

const d3 = require('d3')
const chartByTaskId = 'reports_by_task'
const GQL_CHART_FIELDS =  /* GraphQL */`
  uuid
  tasks { uuid, shortName }
`
const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))

const GQL_MAP_FIELDS =  /* GraphQL */`
  uuid
  intent
  location { uuid, name, lat, lng },
`

/*
 * Component displaying a chart with number of reports per Task.
 */
class ReportsByTask extends Component {
  static propTypes = {
    queryParams: PropTypes.object,
    showLoading: PropTypes.func.isRequired,
    hideLoading: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.taskShortLabel = Settings.fields.task.shortLabel
    this.VISUALIZATIONS = [
      {
        id: 'rbt-chart',
        title: `Chart by ${this.taskShortLabel}`,
        renderer: this.getBarChart,
      },
      {
        id: 'rbt-collection',
        title: `Reports by ${this.taskShortLabel}`,
        renderer: this.getReportCollection,
      },
      {
        id: 'rbt-map',
        title: `Map by ${this.taskShortLabel}`,
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
      graphDataByTask: [],
      reportsPageNum: 0,
      focusedTask: '',
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
          chartId={chartByTaskId}
          data={this.state.graphDataByTask}
          xProp='task.uuid'
          yProp='reportsCount'
          xLabel='task.shortName'
          onBarClick={this.goToTask}
          updateChart={this.state.updateChart}
          selectedBarClass={this.SELECTED_BAR_CLASS}
          selectedBar={this.state.focusedTask ? 'bar_' + this.state.focusedTask.uuid : ''}
          isLoading={this.state.isLoading}
        />)}
      }</ContainerDimensions>
    </div>
  }

  @autobind
  getReportCollection(id)
  {
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
    return (
      <MosaicLayout
        visualizations={this.VISUALIZATIONS}
        initialNode={this.INITIAL_NODE}
        description={`The reports are grouped by ${this.taskShortLabel}. In order to see the
                      list of published reports for a ${this.taskShortLabel}, click on the bar
                      corresponding to the ${this.taskShortLabel}.`}
        additionalStateToWatch={this.state}
      />
    )
  }

  fetchData() {
    this.setState( {isLoading: true} )
    this.props.showLoading()
    // Query used by the chart
    const chartQuery = this.runChartQuery(this.chartQueryParams())
    const noTaskMessage = `No ${Settings.fields.task.shortLabel}`
    const noTask = {
      uuid: "-1",
      shortName: noTaskMessage,
      longName: noTaskMessage
    }
    Promise.all([chartQuery]).then(values => {
      let simplifiedValues = values[0].reportList.list ? values[0].reportList.list.map(d => {return {reportUuid: d.uuid, tasks: d.tasks.map(p => p.uuid)}}): []
      let tasks = values[0].reportList.list ? values[0].reportList.list.map(d => d.tasks) : []
      tasks = [].concat.apply([], tasks)
        .filter((item, index, d) => d.findIndex(t => {return t.uuid === item.uuid }) === index)
        .sort((a, b) => a.shortName.localeCompare(b.shortName))
      // add No Task item, in order to relate to reports without Tasks
      tasks.push(noTask)
      this.setState({
        isLoading: false,
        updateChart: true,  // update chart after fetching the data
        graphDataByTask: tasks
          .map(d => {
            let r = {}
            r.task = d
            r.reportsCount = (d.uuid ? simplifiedValues.filter(item => item.tasks.indexOf(d.uuid) > -1).length : simplifiedValues.filter(item => item.tasks.length === 0).length)
            return r}),
      })
      this.props.hideLoading()
    })
    this.fetchTaskData()
  }

  fetchTaskData() {
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
    if (this.state.focusedTask) {
      Object.assign(reportsQueryParams, {taskUuid: this.state.focusedTask.uuid})
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
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchTaskData())
  }

  @autobind
  goToTask(item) {
    const taskItem = item ? item.task : ''
    this.updateTaskHighlight(taskItem, true)
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus task.
    if (!taskItem || taskItem === this.state.focusedTask) {
      this.setState({updateChart: false, reportsPageNum: 0, focusedTask: ''}, () => this.fetchTaskData())
    } else {
      this.setState({updateChart: false, reportsPageNum: 0, focusedTask: taskItem}, () => this.fetchTaskData())
      this.updateTaskHighlight(taskItem, false)
    }
  }

  updateTaskHighlight(focusedTask, clear) {
    if (clear) {
      // remove highlighting of the bars
      d3.selectAll('#' + chartByTaskId + ' rect').classed(this.SELECTED_BAR_CLASS, false)
    } else if (focusedTask) {
      // highlight the bar corresponding to the selected task
      d3.select('#' + chartByTaskId + ' #bar_' + focusedTask.uuid).classed(this.SELECTED_BAR_CLASS, true)
    }
  }

  componentDidMount() {
    this.fetchData()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.queryParams, this.props.queryParams)) {
      this.setState({
        reportsPageNum: 0,
        focusedTask: ''  // reset focus when changing the queryParams
      }, () => this.fetchData())
    }
  }
}

export default connect(null, mapDispatchToProps)(ReportsByTask)
