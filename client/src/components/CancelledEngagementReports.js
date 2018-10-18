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
import { showLoading, hideLoading } from 'react-redux-loading-bar'

const d3 = require('d3')
const chartByOrgId = 'cancelled_reports_by_org'
const chartByReasonId = 'cancelled_reports_by_reason'
const GQL_CHART_FIELDS =  /* GraphQL */`
  id
  advisorOrg { id, shortName }
  cancelledReason
`
const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))

/*
 * Component displaying a chart with reports cancelled since
 * the given date.
 */
class CancelledEngagementReports extends Component {
  static propTypes = {
    queryParams: PropTypes.object,
    showLoading: PropTypes.func.isRequired,
    hideLoading: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      graphDataByOrg: [],
      graphDataByReason: [],
      reportsPageNum: 0,
      focusedOrg: '',
      focusedReason: '',
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  render() {
    const focusDetails = this.getFocusDetails()
    return (
      <div>
        <p className="help-text">{`Grouped by ${Settings.fields.advisor.org.name}`}</p>
        <p className="chart-description">
          {`The reports are grouped by ${Settings.fields.advisor.org.name}. In order to see the
            list of cancelled engagement reports for an organization, click on
            the bar corresponding to the organization.`}
        </p>
        <BarChartWithLoader
          chartId={chartByOrgId}
          data={this.state.graphDataByOrg}
          xProp='advisorOrg.id'
          yProp='cancelledByOrg'
          xLabel='advisorOrg.shortName'
          onBarClick={this.goToOrg}
          updateChart={this.state.updateChart}
          isLoading={this.state.isLoading} />
        <p className="help-text">{`Grouped by reason for cancellation`}</p>
        <p className="chart-description">
          {`The reports are grouped by reason for cancellation. In order to see
            the list of cancelled engagement reports for a reason for
            cancellation, click on the bar corresponding to the reason for
            cancellation.`}
        </p>
        <BarChartWithLoader
          chartId={chartByReasonId}
          data={this.state.graphDataByReason}
          xProp='cancelledReason'
          yProp='cancelledByReason'
          xLabel='reason'
          onBarClick={this.goToReason}
          updateChart={this.state.updateChart}
          isLoading={this.state.isLoading} />
        <Fieldset
          title={`Cancelled Engagement Reports ${focusDetails.titleSuffix}`}
          id='cancelled-reports-details'
          action={!focusDetails.resetFnc
            ? '' : <Button onClick={() => this[focusDetails.resetFnc]()}>{focusDetails.resetButtonLabel}</Button>
          } >
          <ReportCollection paginatedReports={this.state.reports} goToPage={this.goToReportsPage} />
        </Fieldset>
      </div>
    )
  }

  getReasonDisplayName(reason) {
    return reason ? reason.replace("CANCELLED_", "")
      .replace(/_/g, " ")
      .toLocaleLowerCase()
      .replace(/(\b\w)/gi, function(m) {return m.toUpperCase()}) : ''
  }

  getFocusDetails() {
    let titleSuffix = ''
    let resetFnc = ''
    let resetButtonLabel = ''
    if (this.state.focusedOrg) {
      titleSuffix = `for ${this.state.focusedOrg.shortName}`
      resetFnc = 'goToOrg'
      resetButtonLabel = 'All organizations'
    }
    else if (this.state.focusedReason) {
      titleSuffix = `by ${this.getReasonDisplayName(this.state.focusedReason)}`
      resetFnc = 'goToReason'
      resetButtonLabel = 'All reasons'
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
        graphDataByOrg: reportsList
          .filter((item, index, d) => d.findIndex(t => {return t.advisorOrg.id === item.advisorOrg.id }) === index)
          .map(d => {d.cancelledByOrg = reportsList.filter(item => item.advisorOrg.id === d.advisorOrg.id).length; return d})
          .sort((a, b) => {
            let a_index = pinned_ORGs.indexOf(a.advisorOrg.shortName)
            let b_index = pinned_ORGs.indexOf(b.advisorOrg.shortName)
            if (a_index < 0)
              return (b_index < 0) ?  a.advisorOrg.shortName.localeCompare(b.advisorOrg.shortName) : 1
            else
              return (b_index < 0) ? -1 : a_index-b_index
          }),
        graphDataByReason: reportsList
          .filter((item, index, d) => d.findIndex(t => {return t.cancelledReason === item.cancelledReason }) === index)
          .map(d => {d.cancelledByReason = reportsList.filter(item => item.cancelledReason === d.cancelledReason).length; return d})
          .map(d => {d.reason = this.getReasonDisplayName(d.cancelledReason); return d})
          .sort((a, b) => {
            return a.reason.localeCompare(b.reason)
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

  fetchReasonData() {
    const reportsQueryParams = {}
    Object.assign(reportsQueryParams, this.props.queryParams)
    Object.assign(reportsQueryParams, {
      pageNum: this.state.reportsPageNum,
      pageSize: 10
    })
    if (this.state.focusedReason) {
      Object.assign(reportsQueryParams, {cancelledReason: this.state.focusedReason})
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
        reports: values[0].reportList
      })
    })
  }

  @autobind
  goToReportsPage(newPage) {
    this.setState({updateChart: false, reportsPageNum: newPage}, () => this.state.focusedOrg ? this.fetchOrgData() : this.fetchReasonData())
  }

  resetChartSelection(chartId) {
    d3.selectAll('#' + chartId + ' rect').attr('class', '')
  }

  @autobind
  goToOrg(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus organization.
    this.setState({updateChart: false, reportsPageNum: 0, focusedReason: '', focusedOrg: (item ? item.advisorOrg : '')}, () => this.fetchOrgData())
    // remove highlighting of the bars
    this.resetChartSelection(chartByReasonId)
    this.resetChartSelection(chartByOrgId)
    if (item) {
      // highlight the bar corresponding to the selected organization
      d3.select('#' + chartByOrgId + ' #bar_' + item.advisorOrg.id).attr('class', 'selected-bar')
    }
  }

  @autobind
  goToReason(item) {
    // Note: we set updateChart to false as we do not want to re-render the chart
    // when changing the focus reason.
    this.setState({updateChart: false, reportsPageNum: 0, focusedReason: (item ? item.cancelledReason : ''), focusedOrg: ''}, () => this.fetchReasonData())
    // remove highlighting of the bars
    this.resetChartSelection(chartByReasonId)
    this.resetChartSelection(chartByOrgId)
    if (item) {
      // highlight the bar corresponding to the selected organization
      d3.select('#' + chartByReasonId + ' #bar_' + item.cancelledReason).attr('class', 'selected-bar')
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_isEqual(prevProps.queryParams, this.props.queryParams)) {
      this.setState({
        reportsPageNum: 0,
        focusedReason: '',  // reset focus when changing the queryParams
        focusedOrg: ''
      }, () => this.fetchData())
    }
  }
}

export default connect(null, mapDispatchToProps)(CancelledEngagementReports)
