import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  DEFAULT_SEARCH_QUERY,
  SEARCH_OBJECT_TYPES
} from "actions"
import { Settings } from "api"
import autobind from "autobind-decorator"
import FilterableAdvisorReportsTable from "components/AdvisorReports/FilterableAdvisorReportsTable"
import AppContext from "components/AppContext"
import CancelledEngagementReports from "components/CancelledEngagementReports"
import Fieldset from "components/Fieldset"
import FutureEngagementsByLocation from "components/FutureEngagementsByLocation"
import Messages from "components/Messages"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import PendingApprovalReports from "components/PendingApprovalReports"
import ReportsByDayOfWeek from "components/ReportsByDayOfWeek"
import ReportsByTask from "components/ReportsByTask"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { deserializeQueryParams } from "searchUtils"

export const NOT_APPROVED_REPORTS = "not-approved-reports"
export const CANCELLED_REPORTS = "cancelled-reports"
export const REPORTS_BY_TASK = "reports-by-task"
export const REPORTS_BY_DAY_OF_WEEK = "reports-by-day-of-week"
export const FUTURE_ENGAGEMENTS_BY_LOCATION = "future-engagements-by-location"
export const ADVISOR_REPORTS = "advisor-reports"

export const INSIGHTS = [
  NOT_APPROVED_REPORTS,
  CANCELLED_REPORTS,
  REPORTS_BY_TASK,
  FUTURE_ENGAGEMENTS_BY_LOCATION,
  REPORTS_BY_DAY_OF_WEEK,
  ADVISOR_REPORTS
]

const _SEARCH_PROPS = Object.assign({}, DEFAULT_SEARCH_PROPS, {
  onSearchGoToSearchPage: false,
  searchObjectTypes: [SEARCH_OBJECT_TYPES.REPORTS]
})

export const INSIGHT_DETAILS = {
  [NOT_APPROVED_REPORTS]: {
    searchProps: _SEARCH_PROPS,
    component: PendingApprovalReports,
    navTitle: "Pending Approval Reports",
    title: "",
    dateRange: false,
    showCalendar: true
  },
  [CANCELLED_REPORTS]: {
    searchProps: _SEARCH_PROPS,
    component: CancelledEngagementReports,
    navTitle: "Cancelled Engagement Reports",
    title: "",
    dateRange: false,
    showCalendar: true
  },
  [REPORTS_BY_TASK]: {
    searchProps: _SEARCH_PROPS,
    component: ReportsByTask,
    navTitle: "Reports by Task",
    title: "",
    dateRange: false,
    showCalendar: true
  },
  [REPORTS_BY_DAY_OF_WEEK]: {
    searchProps: _SEARCH_PROPS,
    component: ReportsByDayOfWeek,
    navTitle: "Reports by Day of the Week",
    title: "",
    dateRange: true,
    showCalendar: false
  },
  [FUTURE_ENGAGEMENTS_BY_LOCATION]: {
    searchProps: _SEARCH_PROPS,
    component: FutureEngagementsByLocation,
    navTitle: "Future Engagements by Location",
    title: "",
    dateRange: true,
    onlyShowBetween: true
  },
  [ADVISOR_REPORTS]: {
    searchProps: DEFAULT_SEARCH_PROPS,
    component: FilterableAdvisorReportsTable,
    navTitle: `${Settings.fields.advisor.person.name} Reports`,
    title: `${Settings.fields.advisor.person.name} Reports`,
    dateRange: false,
    showCalendar: false
  }
}

class BaseInsightsShow extends Page {
  static propTypes = {
    ...pagePropTypes,
    appSettings: PropTypes.object
  }

  get cutoffDate() {
    const { appSettings } = this.props || {}
    let maxReportAge =
      1 + (parseInt(appSettings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    return moment()
      .subtract(maxReportAge, "days")
      .clone()
  }
  get currentDateTime() {
    return moment().clone()
  }

  defaultPastDates = {
    referenceDate: this.cutoffDate,
    startDate: this.cutoffDate,
    endDate: this.currentDateTime
  }
  defaultFutureDates = {
    referenceDate: this.currentDateTime,
    startDate: this.currentDateTime,
    endDate: this.currentDateTime.add(14, "days")
  }

  constructor(props) {
    const insightConfig = INSIGHT_DETAILS[props.match.params.insight]
    super(props, DEFAULT_PAGE_PROPS, insightConfig.searchProps)
  }

  get insightDefaultQueryParams() {
    return {
      [NOT_APPROVED_REPORTS]: {
        state: [Report.STATE.PENDING_APPROVAL],
        updatedAtEnd: this.defaultPastDates.referenceDate.endOf("day").valueOf()
      },
      [CANCELLED_REPORTS]: {
        state: [Report.STATE.CANCELLED],
        cancelledReason: "",
        releasedAtStart: this.defaultPastDates.referenceDate
          .startOf("day")
          .valueOf()
      },
      [REPORTS_BY_TASK]: {
        state: [Report.STATE.PUBLISHED],
        releasedAtStart: this.defaultPastDates.referenceDate
          .startOf("day")
          .valueOf()
      },
      [REPORTS_BY_DAY_OF_WEEK]: {
        state: [Report.STATE.PUBLISHED],
        releasedAtStart: this.defaultPastDates.startDate
          .startOf("day")
          .valueOf(),
        releasedAtEnd: this.defaultPastDates.endDate.endOf("day").valueOf(),
        includeEngagementDayOfWeek: 1
      },
      [FUTURE_ENGAGEMENTS_BY_LOCATION]: {
        engagementDateStart: this.defaultFutureDates.startDate
          .startOf("day")
          .valueOf(),
        engagementDateEnd: this.defaultFutureDates.endDate
          .endOf("day")
          .valueOf()
      },
      [ADVISOR_REPORTS]: {}
    }
  }

  @autobind
  deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    this.props.setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
  }

  @autobind
  setInsightDefaultSearchQuery() {
    const insightConfig = INSIGHT_DETAILS[this.props.match.params.insight]
    this.props.setSearchProps(Object.assign({}, insightConfig.searchProps))
    deserializeQueryParams(
      SEARCH_OBJECT_TYPES.REPORTS,
      this.insightDefaultQueryParams[this.props.match.params.insight],
      this.deserializeCallback
    )
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.match.params.insight !== this.props.match.params.insight) {
      // when insight changes we need to update the search query to use the new
      // insight default query params
      // NOTE: this also happens now when using the back browser button from one
      // insight to the previous one. Do we want that?
      this.setInsightDefaultSearchQuery()
    } else if (
      prevProps.searchQuery !== this.props.searchQuery &&
      this.props.searchQuery === DEFAULT_SEARCH_QUERY
    ) {
      // when the search query has been cleared, use the default insight search query
      // (for instance on consecutive clicks on the same insight in the left navigation)
      this.setInsightDefaultSearchQuery()
    }
  }

  componentDidMount() {
    super.componentDidMount()
    if (this.props.searchQuery === DEFAULT_SEARCH_QUERY) {
      // when going from a different page to the insight page,  use the default
      // insight search query
      this.setInsightDefaultSearchQuery()
    }
  }

  render() {
    const insightConfig = INSIGHT_DETAILS[this.props.match.params.insight]
    const InsightComponent = insightConfig.component
    const queryParams = this.getSearchQuery()
    const flexStyle = {
      display: "flex",
      flexDirection: "column",
      flex: "1 1 auto",
      height: "100%"
    }
    const mosaicLayoutStyle = {
      display: "flex",
      flex: "1 1 auto",
      height: "100%"
    }
    const hasSearchCriteria =
      _isEmpty(
        this.insightDefaultQueryParams[this.props.match.params.insight]
      ) || !_isEmpty(queryParams)
    return (
      <div style={flexStyle}>
        <Messages error={this.state.error} success={this.state.success} />
        {hasSearchCriteria ? (
          <Fieldset
            id={this.props.match.params.insight}
            title={insightConfig.title}
            style={flexStyle}
          >
            <InsightComponent
              style={mosaicLayoutStyle}
              queryParams={queryParams}
            />
          </Fieldset>
        ) : (
          <Messages
            error={{ message: "You did not enter any search criteria." }}
          />
        )}
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

const InsightsShow = props => (
  <AppContext.Consumer>
    {context => (
      <BaseInsightsShow appSettings={context.appSettings} {...props} />
    )}
  </AppContext.Consumer>
)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InsightsShow)
