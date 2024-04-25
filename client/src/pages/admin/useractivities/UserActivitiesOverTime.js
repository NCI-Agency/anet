import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import "normalize.css"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  setUserActivitiesState
} from "actions"
import API from "api"
import BarChart from "components/BarChart"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import Checkbox from "components/Checkbox"
import Fieldset from "components/Fieldset"
import MosaicLayout from "components/MosaicLayout"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import _escape from "lodash/escape"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, FormSelect, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useResizeDetector } from "react-resize-detector"
import { useNavigate } from "react-router-dom"
import utils from "utils"

const GQL_GET_USER_ACTIVITY_COUNT = gql`
  query ($userActivityQuery: UserActivitySearchQueryInput) {
    userActivityList(query: $userActivityQuery) {
      totalCount
      list {
        visitedAt
        count
      }
    }
  }
`

const AGGREGATION_DATE_FORMATS = {
  DAY: "D MMMM YYYY",
  WEEK: "[week] W YYYY",
  MONTH: "MMMM YYYY"
}
const DEFAULT_AGGREGATION_PERIOD = "MONTH"
const TIME_WINDOWS = {
  DAY: 31,
  WEEK: 13,
  MONTH: 6
}
const SEARCH_TYPES = {
  PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION",
  TOP_LEVEL_ORGANIZATION: "TOP_LEVEL_ORGANIZATION"
}
const DEFAULT_SEARCH_TYPE = SEARCH_TYPES.PERSON

const UserActivitiesOverTime = ({
  pageDispatchers,
  userActivitiesState,
  setUserActivitiesState
}) => {
  const navigate = useNavigate()
  const { width, height, ref } = useResizeDetector()
  const [aggregationPeriod, setAggregationPeriod] = useState(
    userActivitiesState?.aggregationPeriod ?? DEFAULT_AGGREGATION_PERIOD
  )
  const timeWindow = TIME_WINDOWS[aggregationPeriod]
  const [startDate, setStartDate] = useState(
    userActivitiesState?.startDateOverTime
      ? userActivitiesState?.startDateOverTime
      : startOfCurrentPeriod(aggregationPeriod)
  )
  const endDate = moment
    .utc(startDate)
    .add(timeWindow, aggregationPeriod)
    .endOf(aggregationPeriod)
  const [searchType, setSearchType] = useState(
    userActivitiesState?.searchType ?? DEFAULT_SEARCH_TYPE
  )
  const [showDeleted, setShowDeleted] = useState(
    userActivitiesState?.showDeleted ?? false
  )
  const userActivityQuery = {
    pageNum: 0,
    pageSize: timeWindow + 1,
    sortBy: "NONE",
    startDate,
    endDate,
    searchType,
    aggregationType: "OVER_TIME",
    aggregationPeriod,
    showDeleted
  }
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("User activities over time")
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_USER_ACTIVITY_COUNT,
    {
      userActivityQuery
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const paginatedUserActivities = data.userActivityList
  const userActivities = paginatedUserActivities
    ? paginatedUserActivities.list
    : []
  const showDeletedLabel = `\u00A0incl.\u00A0${
    searchType === SEARCH_TYPES.PERSON ? "deleted" : "unknown"
  }\u00A0${searchType === SEARCH_TYPES.PERSON ? "people" : "organizations"}`
  const searchTypePlural = pluralize(utils.noCase(searchType))
  const tableHeader = `${searchTypePlural} active`
  const tableTitle = `Activity per ${utils.noCase(aggregationPeriod)}`
  const chartTitle = `Number of ${searchTypePlural} per ${utils.noCase(
    aggregationPeriod
  )}`
  const VISUALIZATIONS = [
    {
      id: "ua-table",
      icons: [IconNames.PANEL_TABLE],
      title: tableTitle,
      renderer: renderTable
    },
    {
      id: "ua-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: chartTitle,
      renderer: renderChart
    }
  ]
  const INITIAL_LAYOUT = {
    direction: "row",
    first: VISUALIZATIONS[0].id,
    second: VISUALIZATIONS[1].id,
    splitPercentage: 25
  }
  const DESCRIPTION = "User Activities"
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

  return (
    <div id="user-activities" style={flexStyle}>
      <Fieldset style={fieldsetStyle}>
        <div>
          <div>
            <h2>
              User Activities over time from{" "}
              {moment
                .utc(userActivityQuery.startDate)
                .format(AGGREGATION_DATE_FORMATS[aggregationPeriod])}{" "}
              until{" "}
              {moment
                .utc(userActivityQuery.endDate)
                .format(AGGREGATION_DATE_FORMATS[aggregationPeriod])}
            </h2>
            <div className="clearfix">
              <div className="float-start">
                <Button
                  id="previous-period"
                  onClick={() => showPreviousPeriod(aggregationPeriod)}
                  variant="outline-secondary"
                  className="me-1"
                >
                  <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />
                </Button>
                <ButtonToggleGroup
                  value={aggregationPeriod}
                  onChange={period => changePeriod(period)}
                >
                  {Object.keys(AGGREGATION_DATE_FORMATS).map(ap => (
                    <Button key={ap} value={ap} variant="outline-secondary">
                      {ap.toLowerCase()}
                    </Button>
                  ))}
                </ButtonToggleGroup>
                <Button
                  id="next-period"
                  onClick={() => showNextPeriod(aggregationPeriod)}
                  variant="outline-secondary"
                  className="ms-1"
                >
                  <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
                </Button>
                <Button
                  id="today"
                  onClick={() => showToday(aggregationPeriod)}
                  variant="outline-secondary"
                  className="ms-4"
                >
                  {showTodayLabel(aggregationPeriod)}
                </Button>
                <div className="d-flex align-items-center">
                  <FormSelect
                    className="me-1"
                    defaultValue={searchType}
                    onChange={e =>
                      changeSearchType(e.target.value || DEFAULT_SEARCH_TYPE)}
                  >
                    {Object.values(SEARCH_TYPES).map(st => (
                      <option key={st} value={st}>
                        Show activities by {utils.noCase(st)}
                      </option>
                    ))}
                  </FormSelect>
                  <Checkbox
                    checked={showDeleted}
                    onChange={toggleShowDeleted}
                    label={showDeletedLabel}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <MosaicLayout
          style={mosaicLayoutStyle}
          visualizations={VISUALIZATIONS}
          initialNode={INITIAL_LAYOUT}
          description={DESCRIPTION}
        />
      </Fieldset>
    </div>
  )

  function renderChart() {
    userActivities.forEach(
      ua =>
        (ua.dateLabel = moment
          .utc(ua.visitedAt)
          .format(AGGREGATION_DATE_FORMATS[aggregationPeriod]))
    )
    const tooltip = d => `
      <h4>${_escape(
    moment
      .utc(d.visitedAt)
      .format(AGGREGATION_DATE_FORMATS[aggregationPeriod])
  )}</h4>
      <p>${_escape(d.count)}</p>
    `
    return (
      <div ref={ref} className="non-scrollable">
        <BarChart
          width={width}
          height={height}
          chartId="user_activity_chart"
          data={userActivities}
          xProp="visitedAt"
          yProp="count"
          xLabel="dateLabel"
          onBarClick={goToSelection}
          tooltip={tooltip}
        />
      </div>
    )
  }

  function goToSelection(item) {
    navigate("../perPeriod", {
      state: {
        startDate: item.visitedAt
      }
    })
  }

  function renderTable() {
    return (
      <div className="scrollable">
        <Table responsive hover striped id="user-activities">
          <thead>
            <tr>
              <th>Period</th>
              <th>#{tableHeader}</th>
            </tr>
          </thead>
          <tbody>
            {userActivities.map(ua => (
              <tr key={ua.visitedAt}>
                <td>
                  {moment
                    .utc(ua.visitedAt)
                    .format(AGGREGATION_DATE_FORMATS[aggregationPeriod])}
                </td>
                <td>{ua.count}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  function startOfCurrentPeriod(period) {
    // always in UTC!
    return moment.utc().subtract(timeWindow, period).startOf(period)
  }

  function showNextPeriod(period) {
    changeStartDate(moment.utc(startDate).add(1, period).startOf(period))
  }

  function showPreviousPeriod(period) {
    changeStartDate(moment.utc(startDate).subtract(1, period).startOf(period))
  }

  function showToday(period) {
    changeStartDate(startOfCurrentPeriod(period))
  }

  function changeStartDate(newStartDate) {
    setUserActivitiesState({
      ...userActivitiesState,
      startDateOverTime: newStartDate
    })
    setStartDate(newStartDate)
  }

  function changePeriod(newPeriod) {
    const now = moment.utc()
    const newTimeWindow = TIME_WINDOWS[newPeriod]
    changeStartDate(
      moment
        .utc()
        .min(now, endDate)
        .subtract(newTimeWindow, newPeriod)
        .startOf(newPeriod)
    )
    setUserActivitiesState({
      ...userActivitiesState,
      aggregationPeriod: newPeriod
    })
    setAggregationPeriod(newPeriod)
  }

  function showTodayLabel(period) {
    switch (period) {
      case "MONTH":
        return "This month"
      case "WEEK":
        return "This week"
      default:
        return "Today"
    }
  }

  function toggleShowDeleted() {
    setUserActivitiesState({
      ...userActivitiesState,
      showDeleted: !showDeleted
    })
    setShowDeleted(!showDeleted)
  }

  function changeSearchType(newSearchType) {
    setUserActivitiesState({
      ...userActivitiesState,
      searchType: newSearchType
    })
    setSearchType(newSearchType)
  }
}

UserActivitiesOverTime.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  userActivitiesState: PropTypes.object,
  setUserActivitiesState: PropTypes.func.isRequired
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setUserActivitiesState: userActivitiesState =>
      dispatch(setUserActivitiesState(userActivitiesState)),
    ...pageDispatchers
  }
}

const mapStateToProps = (state, ownProps) => ({
  userActivitiesState: state.userActivitiesState
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserActivitiesOverTime)
