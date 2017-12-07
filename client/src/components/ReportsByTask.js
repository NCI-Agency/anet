import React, {Component} from 'react'
import API from 'api'
import autobind from 'autobind-decorator'
import {Button} from 'react-bootstrap'

import BarChart from 'components/BarChart'
import Fieldset from 'components/Fieldset'
import ReportCollection from 'components/ReportCollection'

import LoaderHOC from '../HOC/LoaderHOC'
import dict from 'dictionary'

const d3 = require('d3')
const chartByTaskId = 'reports_by_task'

const BarChartWithLoader = LoaderHOC('isLoading')('data')(BarChart)

/*
 * Component displaying a chart with number of reports per Task.
 */
export default class ReportsByTask extends Component {
  static propTypes = {
    date: React.PropTypes.object,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphDataByTask: [],
      focusedTask: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  get queryParams() {
    return {
      state: ['RELEASED'],
      releasedAtStart: this.props.date.valueOf(),
    }
  }

  get referenceDateLongStr() { return this.props.date.format('DD MMM YYYY') }

  render() {
    const focusDetails = this.getFocusDetails()
    const taskShortTitle = dict.lookup('POAM_SHORT_NAME')
    return (
      <div>
        <p className="help-text">{`Number of published reports since ${this.referenceDateLongStr}, grouped by ${taskShortTitle}`}</p>
        <p className="chart-description">
          {`Displays the number of published reports which have been released
            since ${this.referenceDateLongStr}. The reports are grouped by
            ${taskShortTitle}. In order to see the list of published reports for a ${taskShortTitle},
            click on the bar corresponding to the ${taskShortTitle}.`}
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
          title={`Reports by Task ${focusDetails.titleSuffix}`}
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
    if (this.state.focusedTask) {
      titleSuffix = `for ${this.state.focusedTask.shortName}`
      resetFnc = 'goToTask'
      resetButtonLabel = 'All tasks'
    }
    return {
      titleSuffix: titleSuffix,
      resetFnc: resetFnc,
      resetButtonLabel: resetButtonLabel
    }
  }

  fetchData() {
    this.setState( {isLoading: true} )
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
    const noTask = {
      id: -1,
      shortName: 'No Task',
      longName: 'No Task'
    }
    Promise.all([chartQuery]).then(values => {
      let simplifiedValues = values[0].reportList.list.map(d => {return {reportId: d.id, tasks: d.poams.map(p => p.id)}})
      let tasks = values[0].reportList.list.map(d => d.poams)
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
    })
    this.fetchTaskData()
  }

  fetchTaskData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: this.state.reportsPageNum,
      pageSize: 10
    })
    if (this.state.focusedTask) {
      Object.assign(reportsQueryParams, {taskId: this.state.focusedTask.id})
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

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.date.valueOf() !== this.props.date.valueOf()) {
      this.setState({
        reportsPageNum: 0,
        focusedTask: ''})  // reset focus when changing the date
    }
  }

  componentDidMount() {
    this.fetchData()
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.date.valueOf() !== this.props.date.valueOf()) {
      this.fetchData()
    }
  }
}
