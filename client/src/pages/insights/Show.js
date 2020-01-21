import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  DEFAULT_SEARCH_QUERY,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import { Settings } from "api"
import FilterableAdvisorReportsTable from "components/AdvisorReports/FilterableAdvisorReportsTable"
import AppContext from "components/AppContext"
import CancelledEngagementReports from "components/CancelledEngagementReports"
import Fieldset from "components/Fieldset"
import FutureEngagementsByLocation from "components/FutureEngagementsByLocation"
import Messages from "components/Messages"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import PendingApprovalReports from "components/PendingApprovalReports"
import ReportsByDayOfWeek from "components/ReportsByDayOfWeek"
import ReportsByTask from "components/ReportsByTask"
import { SearchQueryPropType, getSearchQuery } from "components/SearchFilters"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
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
    title: ""
  },
  [CANCELLED_REPORTS]: {
    searchProps: _SEARCH_PROPS,
    component: CancelledEngagementReports,
    navTitle: "Cancelled Engagement Reports",
    title: ""
  },
  [REPORTS_BY_TASK]: {
    searchProps: _SEARCH_PROPS,
    component: ReportsByTask,
    navTitle: "Reports by Task",
    title: ""
  },
  [REPORTS_BY_DAY_OF_WEEK]: {
    searchProps: _SEARCH_PROPS,
    component: ReportsByDayOfWeek,
    navTitle: "Reports by Day of the Week",
    title: ""
  },
  [FUTURE_ENGAGEMENTS_BY_LOCATION]: {
    searchProps: _SEARCH_PROPS,
    component: FutureEngagementsByLocation,
    navTitle: "Future Engagements by Location",
    title: ""
  },
  [ADVISOR_REPORTS]: {
    searchProps: DEFAULT_SEARCH_PROPS,
    component: FilterableAdvisorReportsTable,
    navTitle: `${Settings.fields.advisor.person.name} Reports`,
    title: `${Settings.fields.advisor.person.name} Reports`
  }
}

const BaseInsightsShow = ({
  pageDispatchers,
  appSettings,
  searchQuery,
  setSearchQuery
}) => {
  const { insight } = useParams()
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
  const defaultPastDates = {
    referenceDate: getCutoffDate(),
    startDate: getCutoffDate(),
    endDate: getCurrentDateTime()
  }
  const defaultFutureDates = {
    referenceDate: getCurrentDateTime(),
    startDate: getCurrentDateTime(),
    endDate: getCurrentDateTime().add(14, "days")
  }
  const insightDefaultQueryParams = {
    [NOT_APPROVED_REPORTS]: {
      state: [Report.STATE.PENDING_APPROVAL],
      updatedAtEnd: defaultPastDates.referenceDate.endOf("day").valueOf()
    },
    [CANCELLED_REPORTS]: {
      state: [Report.STATE.CANCELLED],
      cancelledReason: null,
      releasedAtStart: defaultPastDates.referenceDate.startOf("day").valueOf()
    },
    [REPORTS_BY_TASK]: {
      state: [Report.STATE.PUBLISHED],
      releasedAtStart: defaultPastDates.referenceDate.startOf("day").valueOf()
    },
    [REPORTS_BY_DAY_OF_WEEK]: {
      state: [Report.STATE.PUBLISHED],
      releasedAtStart: defaultPastDates.startDate.startOf("day").valueOf(),
      releasedAtEnd: defaultPastDates.endDate.endOf("day").valueOf(),
      includeEngagementDayOfWeek: 1
    },
    [FUTURE_ENGAGEMENTS_BY_LOCATION]: {
      engagementDateStart: defaultFutureDates.startDate
        .startOf("day")
        .valueOf(),
      engagementDateEnd: defaultFutureDates.endDate.endOf("day").valueOf()
    },
    [ADVISOR_REPORTS]: {}
  }
  let queryParams
  if (searchQuery === DEFAULT_SEARCH_QUERY) {
    // when going from a different page to the insight page, use the default
    // insight search query
    queryParams = setInsightDefaultSearchQuery()
  } else {
    queryParams = getSearchQuery(searchQuery)
  }
  const insightConfig = INSIGHT_DETAILS[insight]
  const InsightComponent = insightConfig.component
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: insightConfig.searchProps,
    pageDispatchers
  })
  const hasSearchCriteria =
    _isEmpty(insightDefaultQueryParams[insight]) || !_isEmpty(queryParams)

  return (
    <div style={flexStyle}>
      {hasSearchCriteria ? (
        <Fieldset id={insight} title={insightConfig.title} style={flexStyle}>
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

  function getCutoffDate() {
    const maxReportAge =
      1 + (parseInt(appSettings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    return moment()
      .subtract(maxReportAge, "days")
      .clone()
  }

  function getCurrentDateTime() {
    return moment().clone()
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
  }

  function setInsightDefaultSearchQuery() {
    const queryParams = insightDefaultQueryParams[insight]
    deserializeQueryParams(
      SEARCH_OBJECT_TYPES.REPORTS,
      queryParams,
      deserializeCallback
    )
    return queryParams
  }
}

BaseInsightsShow.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  searchQuery: SearchQueryPropType,
  setSearchQuery: PropTypes.func.isRequired,
  appSettings: PropTypes.object
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery)),
    ...pageDispatchers
  }
}

const InsightsShow = props => (
  <AppContext.Consumer>
    {context => (
      <BaseInsightsShow appSettings={context.appSettings} {...props} />
    )}
  </AppContext.Consumer>
)

export default connect(mapStateToProps, mapDispatchToProps)(InsightsShow)
