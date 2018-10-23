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
import { IconNames } from '@blueprintjs/icons'

const BarChartWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(BarChart))
const Context = React.createContext()

/*
 * Component displaying reports submitted for approval up to the given date but
 * which have not been approved yet. They are displayed in different
 * presentation forms: chart, summary, table and map.
 */
class PendingApprovalReports extends ReportsVisualisation {
  static propTypes = {...rvPropTypes}

  constructor(props) {
    super(props)

    this.advisorOrgLabel = Settings.fields.advisor.org.name
    this.CHART_ID = 'not_approved_reports_chart'
    this.GQL_CHART_FIELDS =  /* GraphQL */`
      uuid
      advisorOrg { uuid, shortName }
    `
    this.VISUALIZATIONS = [
      {
        id: 'par-chart',
        icons: [IconNames.GROUPED_BAR_CHART],
        title: `Chart by ${this.advisorOrgLabel}`,
        renderer: this.getBarChart,
      },
      {
        id: 'par-collection',
        icons: [IconNames.PANEL_TABLE],
        title: `Reports by ${this.advisorOrgLabel}`,
        renderer: this.getReportCollection,
      },
      {
        id: 'par-map',
        icons: [IconNames.MAP],
        title: `Map by ${this.advisorOrgLabel}`,
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
    this.DESCRIPTION = `The reports are grouped by ${this.advisorOrgLabel}.
      In order to see the list of pending approval reports for an organization,
      click on the bar corresponding to the organization.`

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
    return {advisorOrgUuid: this.state.focusedSelection.advisorOrg.uuid}
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
            xProp='advisorOrg.uuid'
            yProp='notApproved'
            xLabel='advisorOrg.shortName'
            onBarClick={this.goToSelection}
            updateChart={context.updateChart}
            selectedBarClass={this.selectedBarClass}
            selectedBar={context.focusedSelection ? 'bar_' + context.focusedSelection.advisorOrg.uuid : ''}
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
          viewFormats={[FORMAT_TABLE, FORMAT_SUMMARY]}
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
        graphData: reportsList
          .filter((item, index, d) => d.findIndex(t => {return t.advisorOrg.uuid === item.advisorOrg.uuid }) === index)
          .map(d => {d.notApproved = reportsList.filter(item => item.advisorOrg.uuid === d.advisorOrg.uuid).length; return d})
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
    })
  }

  @autobind
  updateHighlight(focusedSelection, clear) {
    super.updateHighlight(focusedSelection ? focusedSelection.advisorOrg.uuid : '', clear)
  }
}

export default connect(null, mapDispatchToProps)(PendingApprovalReports)
