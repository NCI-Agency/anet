import React, {PropTypes} from 'react'
import Page from 'components/Page'
import NotApprovedReports from 'components/NotApprovedReports'
import CancelledReports from 'components/CancelledReports'
import Breadcrumbs from 'components/Breadcrumbs'
import Messages from 'components/Messages'
import Fieldset from 'components/Fieldset'
import CalendarButton from 'components/CalendarButton'
import autobind from 'autobind-decorator'
import moment from 'moment'

import FilterableAdvisorReportsTable from 'components/AdvisorReports/FilterableAdvisorReportsTable'


const calendarButtonCss = {
  marginLeft: '20px',
  marginTop: '-8px',
}

export default class InsightsShow extends Page {
  static contextTypes = {
    app: PropTypes.object.isRequired,
  }

  get notApprovedDateLongStr() { return this.state.notApprovedDate.format('DD MMMM YYYY') }
  get cancelledDateLongStr() { return this.state.cancelledDate.format('DD MMMM YYYY') }

  constructor(props) {
    super(props)

    this.state = {
      notApprovedDate: null,
      cancelledDate: null
    }
  }

  componentDidMount() {
    super.componentDidMount()

    let settings = this.context.app.state.settings
    let maxReportAge = 1 + (parseInt(settings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    let cutoffDate = moment().subtract(maxReportAge, 'days')
    this.setState({notApprovedDate: cutoffDate, cancelledDate: cutoffDate})
  }

  @autobind
  changeNotApprovedDate(newDate) {
    let date = moment(newDate)
    if (date.valueOf() !== this.state.notApprovedDate.valueOf()) {
      this.setState({notApprovedDate: date})
    }
  }

  @autobind
  changeCancelledDate(newDate) {
    let date = moment(newDate)
    if (date.valueOf() !== this.state.cancelledDate.valueOf()) {
      this.setState({cancelledDate: date})
    }
  }

  render() {
    return (
      <div>
        <Breadcrumbs items={[[`Insights`, 'insights/']]} />
        <Messages error={this.state.error} success={this.state.success} />

        {this.state.notApprovedDate &&
          <Fieldset id="not-approved-reports" data-jumptarget title={
            <span>
              Not Approved Reports - {this.notApprovedDateLongStr}
              <CalendarButton onChange={this.changeNotApprovedDate} value={this.state.notApprovedDate.toISOString()} style={calendarButtonCss} />
            </span>
            }>
              <p className="help-text">Number of reports not approved since {this.notApprovedDateLongStr}</p>
              <NotApprovedReports date={this.state.notApprovedDate.clone().startOf('day')} />
          </Fieldset>
        }

        {this.state.cancelledDate &&
          <Fieldset id="cancelled-reports" data-jumptarget title={
            <span>
              Cancelled Reports - {this.cancelledDateLongStr}
              <CalendarButton onChange={this.changeCancelledDate} value={this.state.cancelledDate.toISOString()} style={calendarButtonCss} />
            </span>
            }>
              <p className="help-text">Number of reports cancelled since {this.cancelledDateLongStr}</p>
              <CancelledReports date={this.state.cancelledDate.clone().startOf('day')} />
          </Fieldset>
        }

        <Fieldset id="advisor-reports" data-jumptarget title={
          <span>
            Advisor Reports
          </span>
          }>
          <FilterableAdvisorReportsTable />
        </Fieldset>
      </div>
    )
  }

}
