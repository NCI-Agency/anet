import React, {Component} from 'react'
import API from 'api'
import autobind from 'autobind-decorator'
import {Button} from 'react-bootstrap'

import BarChart from 'components/BarChart'
import Fieldset from 'components/Fieldset'
import ReportCollection from 'components/ReportCollection'


const d3 = require('d3')
const colors = {
  barColor: '#F5CA8D',
  selectedBarColor: '#EC971F'
}
const chartByPoamId = 'reports_by_poam'


/*
 * Component displaying a chart with number of reports per PoAM.
 */
export default class ReportsByPoam extends Component {
  static propTypes = {
    date: React.PropTypes.object,
  }

  constructor(props) {
    super(props)

    this.state = {
      date: props.date,
      graphDataByPoam: [],
      focusedPoam: '',
      updateChart: true  // whether the chart needs to be updated
    }
  }

  get queryParams() {
    return {
      state: ['RELEASED'],
      releasedAtStart: this.state.date.valueOf(),
    }
  }

  render() {
    let chartByPoam = ''
    if (this.state.graphDataByPoam.length) {
      chartByPoam = <BarChart
        chartId={chartByPoamId}
        data={this.state.graphDataByPoam}
        xProp='poam.id'
        yProp='reportsCount'
        xLabel='poam.shortName'
        onBarClick={this.goToPoam}
        barColor={colors.barColor}
        updateChart={this.state.updateChart}
      />
    }
    let focusDetails = this.getFocusDetails()
    return (
      <div>
        {chartByPoam}
        <Fieldset
            title={`Reports by PoAM ${focusDetails.titleSuffix}`}
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
    if (this.state.focusedPoam) {
      titleSuffix = `for ${this.state.focusedPoam.shortName}`
      resetFnc = 'goToPoam'
      resetButtonLabel = 'All PoAMs'
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
      let simplifiedValues = values[0].reportList.list.map(d => {return {reportId: d.id, poams: d.poams.map(p => p.id)}})
      let poams = values[0].reportList.list.map(d => d.poams)
      poams = [].concat.apply([], poams)
        .filter((item, index, d) => d.findIndex(t => {return t.id === item.id }) === index)
        .sort((a, b) => a.shortName.localeCompare(b.shortName))
      // add No PoAM item, in order to relate to reports without PoAMs
      poams.push({id: null, shortName: 'No PoAM', longName: 'No PoAM'})
      this.setState({
        updateChart: true,  // update chart after fetching the data
        graphDataByPoam: poams
          .map(d => {
            let r = {}
            r.poam = d
            r.reportsCount = (d.id ? simplifiedValues.filter(item => item.poams.indexOf(d.id) > -1).length : simplifiedValues.filter(item => item.poams.length === 0).length)
            return r}),
      })
    })
    this.fetchPoamData()
  }

  fetchPoamData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.queryParams)
    Object.assign(reportsQueryParams, {pageNum: this.state.reportsPageNum})
    if (this.state.focusedPoam) {
      Object.assign(reportsQueryParams, {poamId: this.state.focusedPoam.id})
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
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchPoamData())
  }

  resetChartSelection(chartId) {
    d3.selectAll('#' + chartId + ' rect').attr('fill', colors.barColor)
  }

  @autobind
  goToPoam(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus poam.
    this.setState({updateChart: false, reportsPageNum: 0, focusedPoam: (item ? item.poam : '')}, () => this.fetchPoamData())
    // remove highlighting of the bars
    this.resetChartSelection(chartByPoamId)
    if (item) {
      // highlight the bar corresponding to the selected poam
      d3.select('#' + chartByPoamId + ' #bar_' + item.poam.id).attr('fill', colors.selectedBarColor)
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.date.valueOf() !== this.props.date.valueOf()) {
      this.setState({date: nextProps.date, focusedPoam: ''})  // reset focus when changing the date
    }
  }

  componentDidMount() {
    this.fetchData()
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.date.valueOf() !== this.state.date.valueOf()) {
      this.fetchData()
    }
  }
}
