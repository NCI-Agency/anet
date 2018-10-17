import React from 'react'
import PropTypes from 'prop-types'
import autobind from 'autobind-decorator'

import BarChart from 'components/BarChart'
import ReportCollection, {FORMAT_MAP, FORMAT_SUMMARY, FORMAT_TABLE} from 'components/ReportCollection'

import _cloneDeep from 'lodash/cloneDeep'

import { connect } from 'react-redux'
import LoaderHOC, {mapDispatchToProps} from 'HOC/LoaderHOC'

import ReportsVisualisation, {propTypes as rvPropTypes} from 'components/ReportsVisualisation'
import ContainerDimensions from 'react-container-dimensions'
import Settings from 'Settings'

const d3 = require('d3')

const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))
const Context = React.createContext()

/*
 * Component displaying a chart with reports cancelled since
 * the given date.
 */
class CancelledEngagementReports extends ReportsVisualisation {
  static propTypes = {...rvPropTypes}

  constructor(props) {
    super(props)

    this.advisorOrgLabel = Settings.fields.advisor.org.name
    this.CHART_ID_BY_ORG = 'cancelled_reports_by_org'
    this.CHART_ID_BY_REASON = 'cancelled_reports_by_reason'
    this.GQL_CHART_FIELDS =  /* GraphQL */`
      uuid
      advisorOrg { uuid, shortName }
      cancelledReason
    `
    this.VISUALIZATIONS = [
      {
        id: 'cer-chart-by-org',
        title: `Chart by ${this.advisorOrgLabel}`,
        renderer: this.getBarChartByOrg,
      },
      {
        id: 'cer-chart-by-reason',
        title: `Chart by reason for cancellation`,
        renderer: this.getBarChartByReason,
      },
      {
        id: 'cer-collection',
        title: `Reports`,
        renderer: this.getReportCollection,
      },
      {
        id: 'cer-map',
        title: `Map`,
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
      second: {
        direction: 'row',
        first: this.VISUALIZATIONS[2].id,
        second: this.VISUALIZATIONS[3].id,
      },
    }
    this.DESCRIPTION = `The reports are grouped by ${this.advisorOrgLabel} or reason for cancellation.
      In order to see the list of cancelled engagement reports for an organization or a reaons,
      click on the bar corresponding to the organization or the reason.`

    this.state = {
      graphDataByOrg: [],
      graphDataByReason: [],
      reportsPageNum: 0,
      focusedSelection: '',
      focusedIsOrg: true,
      updateChart: true,  // whether the chart needs to be updated
      isLoading: false
    }
  }

  get additionalReportParams() {
    return this.state.focusedIsOrg
      ? {advisorOrgUuid: this.state.focusedSelection.advisorOrg.uuid}
      : {cancelledReason: this.state.focusedSelection.cancelledReason}
  }

  @autobind
  getBarChartByOrg(id) {
    return <Context.Consumer>{context => (
      <div className="non-scrollable">
        <ContainerDimensions>{({width, height}) => (
          <BarChartWithLoader
            width={width}
            height={height}
            chartId={this.CHART_ID_BY_ORG}
            data={context.graphDataByOrg}
            xProp='advisorOrg.uuid'
            yProp='cancelledByOrg'
            xLabel='advisorOrg.shortName'
            onBarClick={this.goToOrg}
            updateChart={context.updateChart}
            selectedBarClass={this.selectedBarClass}
            selectedBar={(context.focusedSelection && this.state.focusedIsOrg) ? 'bar_' + context.focusedSelection.advisorOrg.uuid : ''}
            isLoading={context.isLoading}
          />
        )}</ContainerDimensions>
      </div>
    )}</Context.Consumer>
  }

  @autobind
  getBarChartByReason(id) {
    return <Context.Consumer>{context => (
      <div className="non-scrollable">
        <ContainerDimensions>{({width, height}) => (
          <BarChartWithLoader
            width={width}
            height={height}
            chartId={this.CHART_ID_BY_REASON}
            data={context.graphDataByReason}
            xProp='cancelledReason'
            yProp='cancelledByReason'
            xLabel='reason'
            onBarClick={this.goToReason}
            updateChart={context.updateChart}
            selectedBarClass={this.selectedBarClass}
            selectedBar={(context.focusedSelection && !this.state.focusedIsOrg) ? 'bar_' + context.focusedSelection.cancelledReason : ''}
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

  getReasonDisplayName(reason) {
    return reason ? reason.replace("CANCELLED_", "")
      .replace(/_/g, " ")
      .toLocaleLowerCase()
      .replace(/(\b\w)/gi, function(m) {return m.toUpperCase()}) : ''
  }

  @autobind
  fetchChartData(chartQuery) {
    return Promise.all([chartQuery]).then(values => {
      const pinned_ORGs = Settings.pinned_ORGs
      const noAdvisorOrg = {
        uuid: "-1",
        shortName: `No ${this.advisorOrgLabel}`
      }
      let reportsList = values[0].reportList.list || []
      reportsList = reportsList
        .map(d => { if (!d.advisorOrg) d.advisorOrg = noAdvisorOrg; return d })
      this.setState({
        isLoading: false,
        updateChart: true,  // update chart after fetching the data
        graphDataByOrg: _cloneDeep(reportsList) // clone so we don't update the same reportsList twice!
          .filter((item, index, d) => d.findIndex(t => {return t.advisorOrg.uuid === item.advisorOrg.uuid }) === index)
          .map(d => {d.cancelledByOrg = reportsList.filter(item => item.advisorOrg.uuid === d.advisorOrg.uuid).length; return d})
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
    })
  }

  @autobind
  goToOrg(item) {
    this.updateHighlight(null, true, this.CHART_ID_BY_REASON)
    this.setState({focusedIsOrg: true}, () => {
      super.goToSelection(item, this.CHART_ID_BY_ORG)
    })
  }

  @autobind
  goToReason(item) {
    this.updateHighlight(null, true, this.CHART_ID_BY_ORG)
    this.setState({focusedIsOrg: false}, () => {
      super.goToSelection(item, this.CHART_ID_BY_REASON)
    })
  }

  @autobind
  updateHighlight(focusedSelection, clear, chartId) {
    super.updateHighlight(focusedSelection
      ? (this.state.focusedIsOrg ? focusedSelection.advisorOrg.uuid : focusedSelection.cancelledReason)
      : '', clear, chartId)
  }
}

export default connect(null, mapDispatchToProps)(CancelledEngagementReports)
