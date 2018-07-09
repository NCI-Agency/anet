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
import CalendarButton from 'components/CalendarButton'
import autobind from 'autobind-decorator'
import moment from 'moment'

import FilterableAdvisorReportsTable from 'components/AdvisorReports/FilterableAdvisorReportsTable'
import DateRangeSearch from 'components/advancedSearch/DateRangeSearch'

import Settings from 'Settings'
import AppContext from 'components/AppContext'
import { connect } from 'react-redux'

const insightDetails = {
  'not-approved-reports': {
    component: PendingApprovalReports,
    title: 'Pending Approval Reports',
    dateRange: false,
    showCalendar: true
  },
  'cancelled-reports': {
    component: CancelledEngagementReports,
    title: 'Cancelled Engagement Reports',
    dateRange: false,
    showCalendar: true
  },
  'reports-by-task': {
    component: ReportsByTask,
    title: 'Reports by Task',
    help: '',
    dateRange: false,
    showCalendar: true
  },
  'reports-by-day-of-week': {
    component: ReportsByDayOfWeek,
    title: 'Reports by day of the week',
    help: 'Number of reports by day of the week',
    dateRange: true,
    showCalendar: false
  },
  'advisor-reports': {
    component: FilterableAdvisorReportsTable,
    title: `${Settings.fields.advisor.person.name} Reports`,
    dateRange: false,
    showCalendar: false
  },
  'future-engagements-by-location': {
    component: FutureEngagementsByLocation,
    title: 'Future Engagements by Location',
    help: 'Number of future engagements by location',
    dateRange: true,
    onlyShowBetween: true,
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

  get referenceDateLongStr() { return this.state.referenceDate.format('DD MMMM YYYY') }

  constructor(props) {
    super(props)
    this.state = {
      referenceDate: null,
      startDate: null,
      endDate: null,
      date: {relative: "0", start: null, end: null}
    }
  }

  get defaultDates() {
    return {
      relative: "0",
      start: this.state.startDate.toISOString(),
      end: this.state.endDate.toISOString()
    }
  }

  getFilters = () => {
    const insight = insightDetails[this.props.match.params.insight]
    const calenderFilter = (insight.showCalendar) ? <CalendarButton onChange={this.changeReferenceDate} value={this.state.referenceDate.toISOString()} style={calendarButtonCss} /> : null
    const dateRangeFilter = (insight.dateRange) ? <DateRangeSearch queryKey="engagementDate" value={this.defaultDates} onChange={this.handleChangeDateRange} style={dateRangeFilterCss} onlyBetween={insight.onlyShowBetween} /> : null
    return <span>{dateRangeFilter}{calenderFilter}</span>
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.insight !== this.props.match.params.insight) {
      this.setStateDefaultDates(this.props.match.params.insight)
    }
  }

  componentDidMount() {
    super.componentDidMount()
    this.setStateDefaultDates(this.props.match.params.insight)
  }

  setStateDefaultDates = (insight) => {
    const prefix = insight.split('-', 1).pop()
    if (prefix !== undefined && prefix === PREFIX_FUTURE) {
      this.setStateDefaultFutureDates()
    } else {
      this.setStateDefaultPastDates()
    }
  }

  setStateDefaultPastDates = () => {
    this.setState({
      referenceDate: this.cutoffDate,
      startDate: this.cutoffDate,
      endDate: this.currentDateTime.endOf('day')
    })
  }

  setStateDefaultFutureDates = () => {
    this.setState({
      referenceDate: this.currentDateTime,
      startDate: this.currentDateTime,
      endDate: this.currentDateTime.add(14, 'days').endOf('day')
    })
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
      this.updateDate("endDate", moment(value.end).endOf('day'))
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
    const insightConfig = insightDetails[this.props.match.params.insight]
    const InsightComponent = insightConfig.component
    const insightPath = '/insights/' + this.props.match.params.insight

    return (
      <div>
        <Breadcrumbs items={[['Insights ' + insightConfig.title, insightPath]]} />
        <Messages error={this.state.error} success={this.state.success} />

        {this.state.referenceDate &&
          <Fieldset id={this.props.match.params.insight} data-jumptarget title={
            <span>
              {insightConfig.title}
              {this.getFilters()}
            </span>
            }>
            <InsightComponent
              date={this.state.referenceDate.clone()}
              startDate={this.state.startDate.clone()}
              endDate={this.state.endDate.clone()}
            />
          </Fieldset>
        }
      </div>
    )
  }

}

const InsightsShow = (props) => (
	<AppContext.Consumer>
		{context =>
			<BaseInsightsShow appSettings={context.appSettings} {...props} />
		}
	</AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(InsightsShow)
