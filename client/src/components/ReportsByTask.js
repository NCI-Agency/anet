import React from 'react'
import PropTypes from 'prop-types'
import autobind from 'autobind-decorator'

import BarChart from 'components/BarChart'
import ReportCollection, {FORMAT_MAP, FORMAT_SUMMARY, FORMAT_TABLE} from 'components/ReportCollection'

import { connect } from 'react-redux'
import LoaderHOC, {mapDispatchToProps} from 'HOC/LoaderHOC'
import Settings from 'Settings'

import ReportsVisualisation, {propTypes as rvPropTypes} from 'components/ReportsVisualisation'
import ContainerDimensions from 'react-container-dimensions'

import pluralize from 'pluralize'

const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))
const Context = React.createContext()

/*
 * Component displaying a chart with number of reports per Task.
 */
class ReportsByTask extends ReportsVisualisation {
  static propTypes = {...rvPropTypes}

  constructor(props) {
    super(props)

    this.taskShortLabel = Settings.fields.task.shortLabel
    this.CHART_ID = 'reports_by_task'
    this.GQL_CHART_FIELDS =  /* GraphQL */`
      uuid
      tasks { uuid shortName }
    `
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
    this.INITIAL_LAYOUT = {
      direction: 'column',
      first: {
        direction: 'row',
        first: this.VISUALIZATIONS[0].id,
        second: this.VISUALIZATIONS[1].id,
      },
      second: this.VISUALIZATIONS[2].id,
    }
    this.DESCRIPTION = `The reports are grouped by ${this.taskShortLabel}.
      In order to see the list of published reports for a ${this.taskShortLabel},
      click on the bar corresponding to the ${this.taskShortLabel}.`

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

  get additionalReportParams() {
    return {taskUuid: this.state.focusedSelection.task.uuid}
  }

  @autobind
  getBarChart(id) {
    return <Context.Consumer>{context => (
      <div className="non-scrollable">
        <ContainerDimensions>{({width, height}) => (
          <BarChartWithLoader
            width={width}
            height={height}
            chartId={this.chartId}
            data={context.graphData}
            xProp='task.uuid'
            yProp='reportsCount'
            xLabel='task.shortName'
            onBarClick={this.goToSelection}
            updateChart={context.updateChart}
            selectedBarClass={this.selectedBarClass}
            selectedBar={context.focusedSelection ? 'bar_' + context.focusedSelection.task.uuid : ''}
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
    return (
      <Context.Provider value={this.state}>
        {super.render()}
      </Context.Provider>
    )
  }

  @autobind
  fetchChartData(chartQuery) {
    return Promise.all([chartQuery]).then(values => {
      const noTaskMessage = `No ${Settings.fields.task.shortLabel}`
      const noTask = {
        uuid: "-1",
        shortName: noTaskMessage,
        longName: noTaskMessage
      }
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
        graphData: tasks
          .map(d => {
            let r = {}
            r.task = d
            r.reportsCount = (d.uuid ? simplifiedValues.filter(item => item.tasks.indexOf(d.uuid) > -1).length : simplifiedValues.filter(item => item.tasks.length === 0).length)
            return r}),
      })
    })
  }

  @autobind
  updateHighlight(focusedSelection, clear) {
    super.updateHighlight(focusedSelection ? focusedSelection.task.uuid : '', clear)
  }
}

export default connect(null, mapDispatchToProps)(ReportsByTask)
