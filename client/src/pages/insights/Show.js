import React from 'react'
import PropTypes from 'prop-types'
import Page, {mapDispatchToProps, propTypes as pagePropTypes} from 'components/Page'
import PendingApprovalReports from 'components/PendingApprovalReports'
import CancelledEngagementReports from 'components/CancelledEngagementReports'
import ReportsByTask from 'components/ReportsByTask'
import ReportsByDayOfWeek from 'components/ReportsByDayOfWeek'
import FutureEngagementsByLocation from 'components/FutureEngagementsByLocation'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import Fieldset from 'components/Fieldset'
import autobind from 'autobind-decorator'
import moment from 'moment'

import FilterableAdvisorReportsTable from 'components/AdvisorReports/FilterableAdvisorReportsTable'
import ProgramSummaryView from 'components/ProgramSummaryView'

import OrganizationView from 'components/OrganizationView'
import FULLSCREEN_ICON from 'resources/fullscreen.png'
import Fullscreen from "react-full-screen"
import {Button} from 'react-bootstrap'

import {Report} from 'models'
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS, SEARCH_OBJECT_TYPES } from 'actions'
import Settings from 'Settings'
import AppContext from 'components/AppContext'
import { connect } from 'react-redux'
import _isEqualWith from 'lodash/isEqualWith'
import utils from 'utils'
import {BETWEEN, BEFORE, AFTER, dateToQuery} from 'dateUtils'

export const NOT_APPROVED_REPORTS = 'not-approved-reports'
export const CANCELLED_REPORTS = 'cancelled-reports'
export const REPORTS_BY_TASK = 'reports-by-task'
export const REPORTS_BY_DAY_OF_WEEK = 'reports-by-day-of-week'
export const FUTURE_ENGAGEMENTS_BY_LOCATION = 'future-engagements-by-location'
export const ADVISOR_REPORTS = 'advisor-reports'
export const PROGRAM_SUMMARY_VIEW = 'program-summary-view'
export const ORGANIZATION_VIEW = 'organization-view'

export const INSIGHTS = [
  NOT_APPROVED_REPORTS, CANCELLED_REPORTS, REPORTS_BY_TASK, FUTURE_ENGAGEMENTS_BY_LOCATION, 
  REPORTS_BY_DAY_OF_WEEK, ADVISOR_REPORTS, PROGRAM_SUMMARY_VIEW, ORGANIZATION_VIEW
]

export const INSIGHT_DETAILS = {
  [NOT_APPROVED_REPORTS]: {
    component: PendingApprovalReports,
    navTitle: 'Pending Approval Reports',
    title: 'Number of Pending Approval Reports',
    dateRange: false,
    showCalendar: true
  },
  [CANCELLED_REPORTS]: {
    component: CancelledEngagementReports,
    navTitle: 'Cancelled Engagement Reports',
    title: 'Number of Cancelled Engagement Reports',
    dateRange: false,
    showCalendar: true
  },
  [REPORTS_BY_TASK]: {
    component: ReportsByTask,
    navTitle: 'Reports by Task',
    title: 'Number of Reports by Task',
    dateRange: false,
    showCalendar: true
  },
  [REPORTS_BY_DAY_OF_WEEK]: {
    component: ReportsByDayOfWeek,
    navTitle: 'Reports by Day of the Week',
    title: 'Number of Reports by Day of the Week',
    dateRange: true,
    showCalendar: false
  },
  [FUTURE_ENGAGEMENTS_BY_LOCATION]: {
    component: FutureEngagementsByLocation,
    navTitle: 'Future Engagements by Location',
    title: 'Number of Future Engagements by Location',
    dateRange: true,
    onlyShowBetween: true,
  },
  [ADVISOR_REPORTS]: {
    component: FilterableAdvisorReportsTable,
    navTitle: `${Settings.fields.advisor.person.name} Reports`,
    title: `${Settings.fields.advisor.person.name} Reports`,
    dateRange: false,
    showCalendar: false
  },
  [PROGRAM_SUMMARY_VIEW]: {
    component: ProgramSummaryView,
    navTitle: 'Program summary view',
    title: 'Program summary view',
    dateRange: false,
    onlyShowBetween: false,
  },
  [ORGANIZATION_VIEW]: {
    component: OrganizationView,
    navTitle: 'Organization view',
    title: 'Organization view',
    dateRange: false,
    onlyShowBetween: false,
  },
}

const PREFIX_FUTURE = 'future'

const calendarButtonCss = {
  marginLeft: '20px',
  marginTop: '-8px',
}

const dateRangeFilterCss = {
  marginTop: '20px'
}

function addToQuery(queryKey, value, isDate) {
  // Add toQuery function to a value object, to be used by getSearchQuery
  return {
    ...value,
    toQuery: () => {return isDate ? dateToQuery(queryKey, value) : value}
  }
}

class BaseInsightsShow extends Page {

  static propTypes = {
    ...pagePropTypes,
    appSettings: PropTypes.object,
  }

  get currentDateTime() {
    return moment().clone()
  }

  get cutoffDate() {
    const { appSettings } = this.props || {}
    let maxReportAge = 1 + (parseInt(appSettings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    return moment().subtract(maxReportAge, 'days').clone()
  }

  constructor(props) {
    super(props, Object.assign({}, DEFAULT_PAGE_PROPS), Object.assign({}, DEFAULT_SEARCH_PROPS, {onSearchGoToSearchPage: false}))
    this.state = {
      isFull: false,
      ...this.insightDefaultDates
    }
  }

  toggleFull = () => {
    this.setState( {isFull: !this.state.isFull} )
  }

  get insightDefaultDates() {
    const prefix = this.props.match.params.insight.split('-', 1).pop()
    if (prefix !== undefined && prefix === PREFIX_FUTURE) {
      return this.getDefaultFutureDates()
    } else {
      return this.getDefaultPastDates()
    }
  }

  get insightQueryParams() {
    const params = {
      [NOT_APPROVED_REPORTS]: [
        {key: 'State', isDate: false, queryKey: 'state', value: {state: Report.STATE.PENDING_APPROVAL}},
        {key: 'Update Date', isDate: true, queryKey: 'updatedAt', value: {relative: BEFORE,  end: this.state.referenceDate.toISOString()}},
      ],
      [CANCELLED_REPORTS]: [
        {key: 'State', isDate: false, queryKey: 'state', value: {state: Report.STATE.CANCELLED, cancelledReason: ''}},
        {key: 'Release Date', isDate: true, queryKey: 'releasedAt', value: {relative: AFTER,  start: this.state.referenceDate.toISOString()}},
      ],
      [REPORTS_BY_TASK]: [
        {key: 'State', isDate: false, queryKey: 'state', value: {state: Report.STATE.RELEASED}},
        {key: 'Release Date', isDate: true, queryKey: 'releasedAt', value: {relative: AFTER,  start: this.state.referenceDate.toISOString()}},
      ],
      [REPORTS_BY_DAY_OF_WEEK]: [
        {key: 'State', isDate: false, queryKey: 'state', value: {state: Report.STATE.RELEASED}},
        {key: 'Release Date', isDate: true, queryKey: 'releasedAt', value: {relative: BETWEEN,  start: this.state.startDate.toISOString(), end: this.state.endDate.toISOString()}},
        {key: 'includeEngagementDayOfWeek', isDate: false, queryKey: '', value: 1},
      ],
      [FUTURE_ENGAGEMENTS_BY_LOCATION]: [
        {key: 'Engagement Date', isDate: true, queryKey: 'engagementDate', value: {relative: BETWEEN,  start: this.state.startDate.toISOString(), end: this.state.endDate.toISOString()}},
      ],
      [ADVISOR_REPORTS]: [],
      [PROGRAM_SUMMARY_VIEW]: [],
      [ORGANIZATION_VIEW]: [],
    }
    let insightParams = {}
    Object.keys(params).forEach(function(key, index) {
      insightParams[key] = params[key].map(
        filter => {if (typeof filter.value === 'object') { filter.value = addToQuery(filter.queryKey, filter.value, filter.isDate || false) }; return filter})
    })
    return insightParams
  }

  @autobind
  updateSearchQuery() {
    this.props.setSearchQuery({
      text: '',
      objectType: SEARCH_OBJECT_TYPES.REPORTS,
      filters: this.insightQueryParams[this.props.match.params.insight]
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.insight !== this.props.match.params.insight) {
      const oldQueryParams = this.insightQueryParams[prevProps.match.params.insight]
      const newQueryParams = this.insightQueryParams[this.props.match.params.insight]
      // when changing insight, set dates to insight specific defaults
      const defaultDates = this.insightDefaultDates
      if (!this.state.referenceDate.isSame(defaultDates.referenceDate, 'day') ||
          !this.state.startDate.isSame(defaultDates.startDate, 'day') ||
          !this.state.endDate.isSame(defaultDates.endDate, 'day')) {
        this.setState(
          defaultDates,
          () => this.updateSearchQuery()
        )
      }
      else if (!_isEqualWith(oldQueryParams, newQueryParams, utils.equalFunction)) {
        this.updateSearchQuery()
      }
    }
  }

  componentDidMount() {
    super.componentDidMount()
    this.updateSearchQuery()
    this.props.setSearchProps({
      searchObjectTypes: [SEARCH_OBJECT_TYPES.REPORTS],
    })
  }

  getDefaultPastDates = () => {
    return {
      referenceDate: this.cutoffDate,
      startDate: this.cutoffDate,
      endDate: this.currentDateTime
    }
  }

  getDefaultFutureDates = () => {
    return {
      referenceDate: this.currentDateTime,
      startDate: this.currentDateTime,
      endDate: this.currentDateTime.add(14, 'days')
    }
  }

  handleChangeDateRange = (value) => {
    if (value.relative < 0) {
      this.updateRelativeDateTime(value)
    } else {
      this.updateDateRange(value)
    }
  }

  updateRelativeDateTime = (value) => {
    const startDate = moment(parseInt(value.relative, 10) + this.currentDateTime.valueOf())
    this.setState({
      startDate: startDate,
      endDate: this.currentDateTime
    })
  }

  updateDateRange = (value) => {
    if (value.start !== null) {
      this.updateDate("startDate", moment(value.start))
    }

    if (value.end !== null) {
      this.updateDate("endDate", moment(value.end))
    }
  }

  updateDate = (key, newDate) => {
    const oldDate = this.state[key]
    const dateChaged = newDate.valueOf() !== oldDate.valueOf()
    if (dateChaged) {
      this.setState( { [key]: newDate } )
    }
  }

  @autobind
  changeReferenceDate(newDate) {
    let date = moment(newDate)
    if (date.valueOf() !== this.state.referenceDate.valueOf()) {
      this.setState({referenceDate: date})
    }
  }

  render() {
    const insightConfig = INSIGHT_DETAILS[this.props.match.params.insight]
    const InsightComponent = insightConfig.component
    const insightPath = '/insights/' + this.props.match.params.insight
    const queryParams = this.getSearchQuery()
    const fullscreenButton = <Button onClick={this.toggleFull} style={calendarButtonCss}><img src={FULLSCREEN_ICON} height={16} alt="Switch to fullscreen mode" /></Button>

    return (
      <div>
        <Breadcrumbs items={[['Insights ' + insightConfig.title, insightPath]]} />
        <Messages error={this.state.error} success={this.state.success} />
        {this.state.referenceDate &&
          <Fullscreen enabled={this.state.isFull}
            onChange={isFull => this.setState({isFull})}>
            <Fieldset id={this.props.match.params.insight} data-jumptarget title={
              <span>
                {insightConfig.title}{fullscreenButton}
              </span>
              }>
              <InsightComponent
                queryParams={queryParams}
                date={this.state.referenceDate.clone()}
              />
            </Fieldset>
          </Fullscreen>
        }
      </div>
    )
  }

}

const mapStateToProps = (state, ownProps) => ({
	searchQuery: state.searchQuery
})

const InsightsShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseInsightsShow appSettings={context.appSettings} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(mapStateToProps, mapDispatchToProps)(InsightsShow)
