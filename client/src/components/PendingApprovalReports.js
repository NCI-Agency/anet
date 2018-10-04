import PropTypes from 'prop-types'
import React, {Component} from 'react'
import API from 'api'
import Settings from 'Settings'
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
const chartId = 'not_approved_reports_chart'
const GQL_CHART_FIELDS =  /* GraphQL */`
  id
  advisorOrg { id, shortName }
`
const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))

/*
 * Component displaying reports submitted for approval up to the given date but
 * which have not been approved yet. They are displayed in different
 * presentation forms: chart, summary, table and map.
 */
class PendingApprovalReports extends Component {
  static propTypes = {
    queryParams: PropTypes.object,
    showLoading: PropTypes.func.isRequired,
    hideLoading: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphData: [],
      reports: {list: []},
      reportsPageNum: 0,
      focusedOrg: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  render() {
    const focusDetails = this.focusDetails
    return (
      <div>
        <p className="help-text">{`Grouped by ${Settings.fields.advisor.org.name}`}</p>
        <p className="chart-description">
          {`The reports are grouped by ${Settings.fields.advisor.org.name}. In
            order to see the list of pending approval reports for an organization,
            click on the bar corresponding to the organization.`}
        </p>
        <BarChartWithLoader
          chartId={chartId}
          data={this.state.graphData}
          xProp='advisorOrg.id'
          yProp='notApproved'
          xLabel='advisorOrg.shortName'
          onBarClick={this.goToOrg}
          updateChart={this.state.updateChart}
          isLoading={this.state.isLoading}
        />
        <Fieldset
          title={`Pending Approval Reports ${focusDetails.titleSuffix}`}
          id='not-approved-reports-details'
          action={!focusDetails.resetFnc
            ? '' : <Button onClick={() => this[focusDetails.resetFnc]()}>{focusDetails.resetButtonLabel}</Button>
          } >
          {this.state.reports.list && <ReportCollection paginatedReports={this.state.reports} goToPage={this.goToReportsPage} />}
        </Fieldset>
      </div>
    )
  }

  get focusDetails() {
    let titleSuffix = ''
    let resetFnc = ''
    let resetButtonLabel = ''
    if (this.state.focusedOrg) {
      titleSuffix = `for ${this.state.focusedOrg.shortName}`
      resetFnc = 'goToOrg'
      resetButtonLabel = 'All organizations'
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
    const pinned_ORGs = Settings.pinned_ORGs
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
    const noAdvisorOrg = {
      id: -1,
      shortName: `No ${Settings.fields.advisor.org.name}`
    }
    Promise.all([chartQuery]).then(values => {
      let reportsList = values[0].reportList.list || []
      reportsList = reportsList
        .map(d => { if (!d.advisorOrg) d.advisorOrg = noAdvisorOrg; return d })
      this.setState({
        isLoading: false,
        updateChart: true,  // update chart after fetching the data
        graphData: reportsList
          .filter((item, index, d) => d.findIndex(t => {return t.advisorOrg.id === item.advisorOrg.id }) === index)
          .map(d => {d.notApproved = reportsList.filter(item => item.advisorOrg.id === d.advisorOrg.id).length; return d})
          .sort((a, b) => {
            let a_index = pinned_ORGs.indexOf(a.advisorOrg.shortName)
            let b_index = pinned_ORGs.indexOf(b.advisorOrg.shortName)
            if (a_index < 0) {
              return (b_index < 0) ?  a.advisorOrg.shortName.localeCompare(b.advisorOrg.shortName) : 1
            }
            else {
              return (b_index < 0) ? -1 : a_index-b_index
            }
          })
      })
      this.props.hideLoading()
    })
    this.fetchOrgData()
  }

  fetchOrgData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: this.state.reportsPageNum,
      pageSize: 10
    })
    if (this.state.focusedOrg) {
      Object.assign(reportsQueryParams, {advisorOrgId: this.state.focusedOrg.id})
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

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.fetchOrgData())
  }

  resetChartSelection() {
    d3.selectAll('#' + chartId + ' rect').attr('class', '')
  }

  @autobind
  goToOrg(item) {
    // Note: we set updateChart to false as we do not want to rerender the chart
    // when changing the focus organization.
    this.setState({updateChart: false, reportsPageNum: 0, focusedOrg: (item ? item.advisorOrg : '')}, () => this.fetchOrgData())
    // remove highlighting of the bars
    this.resetChartSelection()
    if (item) {
      // highlight the bar corresponding to the selected organization
      d3.select('#' + chartId + ' #bar_' + item.advisorOrg.id).attr('class', 'selected-bar')
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.queryParams, this.props.queryParams)) {
      this.setState({
        reportsPageNum: 0,
        focusedOrg: ''  // reset focus when changing the queryParams
      }, () => this.fetchData())
    }
  }

}

export default connect(null, mapDispatchToProps)(PendingApprovalReports)
