import React from 'react'
import PropTypes from 'prop-types'
import Page from 'components/Page'
import PendingApprovalReports from 'components/PendingApprovalReports'
import CancelledEngagementReports from 'components/CancelledEngagementReports'
import ReportsByPoam from 'components/ReportsByPoam'
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
  'reports-by-poam': {
    component: ReportsByPoam,
    title: 'Reports by PoAM',
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
    title: 'Advisor Reports',
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

export default class InsightsShow extends Page {
  static contextTypes = {
    app: PropTypes.object.isRequired,
  }

  get currentDateTime() {
    return moment().clone()
  }

  get cutoffDate() {
    let settings = this.context.app.state.settings
    let maxReportAge = 1 + (parseInt(settings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    return moment().subtract(maxReportAge, 'days').clone()
  }

  get referenceDateLongStr() { return this.state.referenceDate.format('DD MMMM YYYY') }

  constructor(props) {
    super(props)
    this.state = {
      insight: props.params.insight,
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
    const insight = insightDetails[this.state.insight]
    const calenderFilter = (insight.showCalendar) ? <CalendarButton onChange={this.changeReferenceDate} value={this.state.referenceDate.toISOString()} style={calendarButtonCss} /> : null
    const dateRangeFilter = (insight.dateRange) ? <DateRangeSearch queryKey="engagementDate" value={this.defaultDates} onChange={this.handleChangeDateRange} style={dateRangeFilterCss} onlyBetween={insight.onlyShowBetween} /> : null
    return <span>{dateRangeFilter}{calenderFilter}</span>
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.insight !== this.state.insight) {
      this.setState({insight: nextProps.params.insight})
      this.setStateDefaultDates(nextProps.params.insight)
    }
  }

  componentDidMount() {
    super.componentDidMount()
    this.setStateDefaultDates(this.state.insight)
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
    const insightConfig = insightDetails[this.state.insight]
    const InsightComponent = insightConfig.component
    const insightPath = '/insights/' + this.state.insight

    return (
      <div>
        <Breadcrumbs items={[['Insights ' + insightConfig.title, insightPath]]} />
        <Messages error={this.state.error} success={this.state.success} />

        {this.state.referenceDate &&
          <Fieldset id={this.state.insight} data-jumptarget title={
            <span>
              {insightConfig.title}
              {this.getFilters()}
            </span>
            }>
            <InsightComponent
              date={this.state.referenceDate.clone()}
              startDate={this.state.startDate.clone()}
              endDate={this.state.endDate.clone()} />
          </Fieldset>
        }
      </div>
    )
  }

}
