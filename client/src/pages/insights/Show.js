import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  DEFAULT_SEARCH_QUERY,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import FilterableAdvisorReportsTable from "components/AdvisorReports/FilterableAdvisorReportsTable"
import AppContext from "components/AppContext"
import CancelledEngagementReports from "components/CancelledEngagementReports"
import Fieldset from "components/Fieldset"
import FutureEngagementsByLocation from "components/FutureEngagementsByLocation"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import PendingApprovalReports from "components/PendingApprovalReports"
import PendingAssessmentsByPosition from "components/PendingAssessmentsByPosition"
import ReportsByDayOfWeek from "components/ReportsByDayOfWeek"
import ReportsByTask from "components/ReportsByTask"
import {
  deserializeQueryParams,
  getSearchQuery,
  SearchQueryPropType
} from "components/SearchFilters"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"

export const NOT_APPROVED_REPORTS = "not-approved-reports"
export const CANCELLED_REPORTS = "cancelled-engagement-reports"
export const REPORTS_BY_TASK = "reports-by-task"
export const REPORTS_BY_DAY_OF_WEEK = "reports-by-day-of-week"
export const FUTURE_ENGAGEMENTS_BY_LOCATION = "future-engagements-by-location"
export const PENDING_ASSESSMENTS_BY_POSITION = "pending-assessments-by-position"
export const ADVISOR_REPORTS = "advisor-reports"

export const INSIGHTS = [
  NOT_APPROVED_REPORTS,
  CANCELLED_REPORTS,
  REPORTS_BY_TASK,
  FUTURE_ENGAGEMENTS_BY_LOCATION,
  REPORTS_BY_DAY_OF_WEEK,
  PENDING_ASSESSMENTS_BY_POSITION,
  ADVISOR_REPORTS
]

const REPORT_SEARCH_PROPS = Object.assign({}, DEFAULT_SEARCH_PROPS, {
  onSearchGoToSearchPage: false,
  searchObjectTypes: [SEARCH_OBJECT_TYPES.REPORTS]
})

const POSITION_SEARCH_PROPS = Object.assign({}, DEFAULT_SEARCH_PROPS, {
  onSearchGoToSearchPage: false,
  searchObjectTypes: [SEARCH_OBJECT_TYPES.POSITIONS]
})

export const INSIGHT_DETAILS = {
  [NOT_APPROVED_REPORTS]: {
    searchProps: REPORT_SEARCH_PROPS,
    component: PendingApprovalReports,
    navTitle: "Pending Approval Reports",
    title: ""
  },
  [CANCELLED_REPORTS]: {
    searchProps: REPORT_SEARCH_PROPS,
    component: CancelledEngagementReports,
    navTitle: "Cancelled Engagement Reports",
    title: ""
  },
  [REPORTS_BY_TASK]: {
    searchProps: REPORT_SEARCH_PROPS,
    component: ReportsByTask,
    navTitle: `Reports by ${Settings.fields.task.subLevel.shortLabel}`,
    title: ""
  },
  [REPORTS_BY_DAY_OF_WEEK]: {
    searchProps: REPORT_SEARCH_PROPS,
    component: ReportsByDayOfWeek,
    navTitle: "Reports by Day of the Week",
    title: ""
  },
  [FUTURE_ENGAGEMENTS_BY_LOCATION]: {
    searchProps: REPORT_SEARCH_PROPS,
    component: FutureEngagementsByLocation,
    navTitle: "Future Engagements by Location",
    title: ""
  },
  [PENDING_ASSESSMENTS_BY_POSITION]: {
    searchProps: POSITION_SEARCH_PROPS,
    component: PendingAssessmentsByPosition,
    navTitle: "Pending Assessments by Position",
    title: ""
  },
  [ADVISOR_REPORTS]: {
    searchProps: DEFAULT_SEARCH_PROPS,
    component: FilterableAdvisorReportsTable,
    navTitle: `${Settings.fields.advisor.person.name} Reports`,
    title: `${Settings.fields.advisor.person.name} Reports`
  }
}

const InsightsShow = ({ pageDispatchers, searchQuery, setSearchQuery }) => {
  const { appSettings, currentUser } = useContext(AppContext)
  const { insight } = useParams()
  const flexStyle = {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    height: "100%",
    overflow: "auto"
  }
  const fieldsetStyle = {
    height: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column"
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
  const orgQuery = currentUser.isAdmin()
    ? {}
    : {
      organizationUuid: currentUser.position.organization.uuid,
      orgRecurseStrategy: currentUser.isSuperuser()
        ? RECURSE_STRATEGY.CHILDREN
        : RECURSE_STRATEGY.NONE
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
      includeEngagementDayOfWeek: true
    },
    [FUTURE_ENGAGEMENTS_BY_LOCATION]: {
      engagementDateStart: defaultFutureDates.startDate
        .startOf("day")
        .valueOf(),
      engagementDateEnd: defaultFutureDates.endDate.endOf("day").valueOf()
    },
    [PENDING_ASSESSMENTS_BY_POSITION]: {
      hasPendingAssessments: true,
      ...orgQuery
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

  return (
    <div style={flexStyle}>
      <Fieldset id={insight} title={insightConfig.title} style={fieldsetStyle}>
        <InsightComponent
          pageDispatchers={pageDispatchers}
          style={mosaicLayoutStyle}
          queryParams={queryParams}
        />
      </Fieldset>
    </div>
  )

  function getCutoffDate() {
    const maxReportAge =
      1 + (parseInt(appSettings.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, 10) || 14)
    return moment().subtract(maxReportAge, "days").clone()
  }

  function getCurrentDateTime() {
    return moment().clone()
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType,
      filters,
      text
    })
  }

  function setInsightDefaultSearchQuery() {
    const insightConfig = INSIGHT_DETAILS[insight]
    const queryParams = insightDefaultQueryParams[insight]
    deserializeQueryParams(
      insightConfig.searchProps.searchObjectTypes[0],
      queryParams,
      deserializeCallback
    )
    return queryParams
  }
}

InsightsShow.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  searchQuery: SearchQueryPropType,
  setSearchQuery: PropTypes.func.isRequired
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

export default connect(mapStateToProps, mapDispatchToProps)(InsightsShow)
