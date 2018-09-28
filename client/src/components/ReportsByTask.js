import PropTypes from 'prop-types'
import React, {Component} from 'react'
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
import Settings from 'Settings'

import pluralize from 'pluralize'

const d3 = require('d3')
const chartByTaskId = 'reports_by_task'
const GQL_CHART_FIELDS =  /* GraphQL */`
  id
  tasks { id, shortName }
`
const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))

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

    this.state = {
      graphDataByTask: [],
      reportsPageNum: 0,
      focusedTask: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  render() {
    const focusDetails = this.getFocusDetails()
    const taskShortLabel = Settings.fields.task.shortLabel
    return (
      <div>
        <p className="help-text">{`Grouped by ${taskShortLabel}`}</p>
        <p className="chart-description">
          {`The reports are grouped by ${taskShortLabel}. In order to see the
            list of published reports for a ${taskShortLabel}, click on the bar
            corresponding to the ${taskShortLabel}.`}
        </p>
        <BarChartWithLoader
          chartId={chartByTaskId}
          data={this.state.graphDataByTask}
          xProp='task.id'
          yProp='reportsCount'
          xLabel='task.shortName'
          onBarClick={this.goToTask}
          updateChart={this.state.updateChart}
          isLoading={this.state.isLoading}
        />
        <Fieldset
          title={`Reports by ${taskShortLabel} ${focusDetails.titleSuffix}`}
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
    const allTasks = `All ${pluralize(Settings.fields.task.shortLabel)}`

    if (this.state.focusedTask) {
      titleSuffix = `for ${this.state.focusedTask.shortName}`
      resetFnc = 'goToTask'
      resetButtonLabel = allTasks
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
    const chartQueryParams = {}
    Object.assign(chartQueryParams, this.props.queryParams)
    Object.assign(chartQueryParams, {
      pageNum: 0,
      pageSize: 0,  // retrieve all the filtered reports
    })
    // Query used by the chart
    const chartQuery = API.query(/* GraphQL */`
        reportList(query:$chartQueryParams) {
          totalCount, list {
            ${GQL_CHART_FIELDS}
          }
        }
      `, {chartQueryParams}, '($chartQueryParams: ReportSearchQueryInput)')
    const noTaskMessage = `No ${Settings.fields.task.shortLabel}`
    const noTask = {
      id: -1,
      shortName: noTaskMessage,
      longName: noTaskMessage
    }
    Promise.all([chartQuery]).then(values => {
      let simplifiedValues = values[0].reportList.list ? values[0].reportList.list.map(d => {return {reportId: d.id, tasks: d.tasks.map(p => p.id)}}): []
      let tasks = values[0].reportList.list ? values[0].reportList.list.map(d => d.tasks) : []
      tasks = [].concat.apply([], tasks)
        .filter((item, index, d) => d.findIndex(t => {return t.id === item.id }) === index)
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
            r.reportsCount = (d.id ? simplifiedValues.filter(item => item.tasks.indexOf(d.id) > -1).length : simplifiedValues.filter(item => item.tasks.length === 0).length)
            return r}),
      })
      this.props.hideLoading()
    })
    this.fetchTaskData()
  }

  fetchTaskData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: this.state.reportsPageNum,
      pageSize: 10
    })
    if (this.state.focusedTask) {
      Object.assign(reportsQueryParams, {taskId: this.state.focusedTask.id})
    }
    // Query used by the reports collection
    const reportsQuery = API.query(/* GraphQL */`
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

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchTaskData())
  }

  resetChartSelection(chartId) {
    d3.selectAll('#' + chartId + ' rect').attr('class', '')
  }

  @autobind
  goToTask(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus task.
    this.setState({updateChart: false, reportsPageNum: 0, focusedTask: (item ? item.task : '')}, () => this.fetchTaskData())
    // remove highlighting of the bars
    this.resetChartSelection(chartByTaskId)
    if (item) {
      // highlight the bar corresponding to the selected task
      d3.select('#' + chartByTaskId + ' #bar_' + item.task.id).attr('class', 'selected-bar')
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
