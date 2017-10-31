import React, {PropTypes} from 'react'
import Page from 'components/Page'
import NotApprovedReports from 'components/NotApprovedReports'
import CancelledReports from 'components/CancelledReports'
import ReportsByPoam from 'components/ReportsByPoam'
import FutureEngagementsByLocation from 'components/FutureEngagementsByLocation'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import Fieldset from 'components/Fieldset'
import CalendarButton from 'components/CalendarButton'
import autobind from 'autobind-decorator'
import moment from 'moment'

import FilterableAdvisorReportsTable from 'components/AdvisorReports/FilterableAdvisorReportsTable'
import FutureEngagementInsights from 'components/FutureEngagementInsights'


const insightDetails = {
  'not-approved-reports': {
    component: NotApprovedReports,
    title: 'Not Approved Reports',
    help: 'Number of reports not approved since',
    showCalendar: true
  },
  'cancelled-reports': {
    component: CancelledReports,
    title: 'Cancelled Reports',
    help: 'Number of reports cancelled since',
    showCalendar: true
  },
  'reports-by-poam': {
    component: ReportsByPoam,
    title: 'Reports by PoAM',
    help: 'Number of reports by PoAM',
    showCalendar: true
  },
  'advisor-reports': {
    component: FilterableAdvisorReportsTable,
    title: 'Advisor Reports',
    showCalendar: false
  },
  'future-engagements-by-location': {
    component: FutureEngagementsByLocation,
    title: 'Future Engagements by Location',
    help: 'Number of future engagements by location'
  },
}
const calendarButtonCss = {
  marginLeft: '20px',
  marginTop: '-8px',
}


export default class InsightsShow extends Page {
  static contextTypes = {
    app: PropTypes.object.isRequired,
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
      referenceDate: null
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.insight !== this.state.insight) {
      this.setState({insight: nextProps.params.insight, referenceDate: this.cutoffDate})
    }
  }

  componentDidMount() {
    super.componentDidMount()

    this.setState({referenceDate: this.cutoffDate})
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
    const showCalendar = insightDetails[this.state.insight].showCalendar
    return (
      <div>
        <Breadcrumbs items={[['Insights ' + insightTitle, insightPath]]} />
        <Messages error={this.state.error} success={this.state.success} />

        {this.state.referenceDate &&
          <Fieldset id={this.state.insight} data-jumptarget title={
            <span>
              {insightTitle} - {this.referenceDateLongStr}
            {showCalendar &&
              <CalendarButton onChange={this.changeReferenceDate} value={this.state.referenceDate.toISOString()} style={calendarButtonCss} />
            }
            </span>
            }>
              {help && <p className="help-text">{help} {this.referenceDateLongStr}</p> }
              <InsightComponent date={this.state.referenceDate.clone().startOf('day')} />
          </Fieldset>
        }
      </div>
    )
  }

}
