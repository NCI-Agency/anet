import React from 'react'
import PropTypes from 'prop-types'
import Page from 'components/Page'
import NotApprovedReports from 'components/NotApprovedReports'
import CancelledReports from 'components/CancelledReports'
import DateRangeSearch from 'components/advancedSearch/DateRangeSearch'
import ReportsByPoam from 'components/ReportsByPoam'
import FilterableAdvisorReportsTable from 'components/AdvisorReports/FilterableAdvisorReportsTable'
import FutureEngagementsByLocation from 'components/FutureEngagementsByLocation'
import ReportsByDayOfWeek from 'components/ReportsByDayOfWeek'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import Fieldset from 'components/Fieldset'
import CalendarButton from 'components/CalendarButton'
import autobind from 'autobind-decorator'
import moment from 'moment'

const insightDetails = {
  'not-approved-reports': {
    component: NotApprovedReports,
    title: 'Not Approved Reports',
    help: 'Number of reports not approved since',
    dateRange: false,
    showCalendar: true
  },
  'cancelled-reports': {
    component: CancelledReports,
    title: 'Cancelled Reports',
    help: 'Number of reports cancelled since',
    dateRange: false,
    showCalendar: true
  },
  'reports-by-poam': {
    component: ReportsByPoam,
    title: 'Reports by PoAM',
    help: 'Number of reports by PoAM',
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

const calendarButtonCss = {
  marginLeft: '20px',
  marginTop: '-8px',
}

const dateRangeFilterCss = {
  marginTop: '20px'
}

const insight = insightDetails[this.state.insight]

export default class InsightsShow extends Page {
  static contextTypes = {
    app: PropTypes.object.isRequired,
  }

  get currentDateTime() {
    return moment()
  }

  get cutoffDate() {
    let settings = this.context.app.state.settings
    let maxReportAge = 1 + (parseInt(settings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    return moment().subtract(maxReportAge, 'days')
  }

  get referenceDateLongStr() { return this.state.referenceDate.format('DD MMMM YYYY') }

  constructor(props) {
    super(props)
    this.state = {
      insight: props.params.insight,
      referenceDate: null,
      startDate: null,
      endDate: null,
    }
  }

  getFilters = () => {
    const calenderFilter = (insight.showCalendar) ? <CalendarButton onChange={this.changeReferenceDate} value={this.state.referenceDate.toISOString()} style={calendarButtonCss} /> : null
    const dateRangeFilter = (insight.dateRange) ? <DateRangeSearch queryKey="engagementDate" value="" onChange={this.handleChangeDateRange} style={dateRangeFilterCss} onlyBetween={insight.onlyShowBetween} /> : null
    return <span>{dateRangeFilter}{calenderFilter}</span>
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.insight !== this.state.insight) {
      this.setState({insight: nextProps.params.insight, referenceDate: this.cutoffDate})
    }
  }

  componentDidMount() {
    super.componentDidMount()

    this.setState({
      referenceDate: this.cutoffDate,
      startDate: this.cutoffDate,
      endDate: this.currentDateTime
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
    let InsightComponent = insightDetails[this.state.insight].component
    let insightTitle = insightDetails[this.state.insight].title
    let insightPath = '/insights/' + this.state.insight

    const help = insightDetails[this.state.insight].help
    return (
      <div>
        <Breadcrumbs items={[['Insights ' + insightTitle, insightPath]]} />
        <Messages error={this.state.error} success={this.state.success} />

        {this.state.referenceDate &&
          <Fieldset id={this.state.insight} data-jumptarget title={
            <span>
              {insightTitle}
              {this.getFilters()}
            </span>
            }>
              <p className="help-text">{help} {this.referenceDateLongStr}</p>
              <InsightComponent
                date={this.state.referenceDate.clone().startOf('day')}
                startDate={this.state.startDate}
                endDate={this.state.endDate.clone().startOf('day')} />
          </Fieldset>
        }
      </div>
    )
  }

}
