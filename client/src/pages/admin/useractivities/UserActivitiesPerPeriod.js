import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
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
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import MosaicLayout from "components/MosaicLayout"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import _escape from "lodash/escape"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, FormSelect, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useResizeDetector } from "react-resize-detector"
import { useLocation } from "react-router-dom"
import utils from "utils"

const GQL_GET_USER_ACTIVITY_LIST_BY_ORGANIZATION = gql`
  query ($userActivityQuery: UserActivitySearchQueryInput) {
    userActivityList(query: $userActivityQuery) {
      pageNum
      pageSize
      totalCount
      list {
        organizationUuid
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        visitedAt
        count
      }
    }
  }
`

const GQL_GET_USER_ACTIVITY_LIST_BY_PERSON = gql`
  query ($userActivityQuery: UserActivitySearchQueryInput) {
    userActivityList(query: $userActivityQuery) {
      pageNum
      pageSize
      totalCount
      list {
        personUuid
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          user
          domainUsername
        }
        visitedAt
        count
      }
    }
  }
`

const DELETED_PERSON = "<deleted person>"
const UNKNOWN_ORGANIZATION = "<unknown organization>"
const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25

const AGGREGATION_DATE_FORMATS = {
  DAY: "D MMMM YYYY",
  WEEK: "[week] W YYYY",
  MONTH: "MMMM YYYY"
}
const DEFAULT_AGGREGATION_PERIOD = "MONTH"
const SEARCH_TYPES = {
  PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION",
  TOP_LEVEL_ORGANIZATION: "TOP_LEVEL_ORGANIZATION"
}
const DEFAULT_SEARCH_TYPE = SEARCH_TYPES.PERSON
const GQL_QUERIES = {
  [SEARCH_TYPES.PERSON]: GQL_GET_USER_ACTIVITY_LIST_BY_PERSON,
  [SEARCH_TYPES.ORGANIZATION]: GQL_GET_USER_ACTIVITY_LIST_BY_ORGANIZATION,
  [SEARCH_TYPES.TOP_LEVEL_ORGANIZATION]:
    GQL_GET_USER_ACTIVITY_LIST_BY_ORGANIZATION
}

const UserActivitiesPerPeriod = ({
  pageDispatchers,
  userActivitiesState,
  setUserActivitiesState
}) => {
  const { width, height, ref } = useResizeDetector()
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [aggregationPeriod, setAggregationPeriod] = useState(
    userActivitiesState?.aggregationPeriod ?? DEFAULT_AGGREGATION_PERIOD
  )
  const routerLocation = useLocation()
  const { state } = routerLocation
  const [startDate, setStartDate] = useState(
    state?.startDate
      ? moment.utc(state?.startDate)
      : userActivitiesState?.startDatePerPeriod
        ? userActivitiesState?.startDatePerPeriod
        : startOfCurrentPeriod(aggregationPeriod)
  )
  const [searchType, setSearchType] = useState(
    userActivitiesState?.searchType ?? DEFAULT_SEARCH_TYPE
  )
  const [showDeleted, setShowDeleted] = useState(
    userActivitiesState?.showDeleted ?? false
  )
  const userActivityQuery = {
    pageNum,
    pageSize,
    startDate,
    endDate: moment.utc(startDate).endOf(aggregationPeriod),
    searchType,
    aggregationType: "BY_OBJECT",
    showDeleted
  }
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("User activities per period")
  const { loading, error, data } = API.useApiQuery(GQL_QUERIES[searchType], {
    userActivityQuery
  })
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
  const { totalCount } = paginatedUserActivities
  const userActivitiesExist = totalCount > 0
  const showDeletedLabel = `\u00A0incl.\u00A0${
    searchType === SEARCH_TYPES.PERSON ? "deleted" : "unknown"
  }\u00A0${searchType === SEARCH_TYPES.PERSON ? "people" : "organizations"}`
  const tableHeader = `${
    searchType === SEARCH_TYPES.PERSON ? "minutes" : "people"
  } active`
  const searchTypePlural = pluralize(utils.noCase(searchType))
  const tableTitle = `Activity per ${utils.noCase(searchType)}`
  const chartTitle = `Number of ${tableHeader} per ${utils.noCase(searchType)}`
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
          <UltimatePagination
            Component="header"
            className="float-end"
            pageNum={pageNum}
            pageSize={pageSize}
            totalCount={totalCount}
            goToPage={setPageNum}
          />
          <div>
            <h2>
              User Activities for{" "}
              {moment
                .utc(userActivityQuery.startDate)
                .format(AGGREGATION_DATE_FORMATS[aggregationPeriod])}
              , total {searchTypePlural} active this period: {totalCount}
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
              <div className="float-end">
                Number per page:
                <FormSelect
                  defaultValue={pageSize}
                  onChange={e =>
                    changePageSize(
                      parseInt(e.target.value, 10) || DEFAULT_PAGESIZE
                    )}
                >
                  {PAGESIZES.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </FormSelect>
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
    let xProp
    let xLabel
    let tooltip
    if (searchType === SEARCH_TYPES.PERSON) {
      xProp = "personUuid"
      xLabel = ["person.name", DELETED_PERSON]
      tooltip = d => `
        <h4>${_escape(d?.person?.name || DELETED_PERSON)}</h4>
        <p>${_escape(d.count)}</p>
      `
    } else {
      xProp = "organizationUuid"
      xLabel = ["organization.shortName", UNKNOWN_ORGANIZATION]
      tooltip = d => `
        <h4>${_escape(d?.organization?.shortName || UNKNOWN_ORGANIZATION)}</h4>
        <p>${_escape(d.count)}</p>
      `
    }

    return (
      <div ref={ref} className="non-scrollable">
        <BarChart
          width={width}
          height={height}
          chartId="user_activity_chart"
          data={userActivities}
          xProp={xProp}
          yProp="count"
          xLabel={xLabel}
          tooltip={tooltip}
        />
      </div>
    )
  }

  function renderTable() {
    if (!userActivitiesExist) {
      return (
        <div className="scrollable">
          <div className="clearfix">
            <em>No user activities found</em>
          </div>
        </div>
      )
    }

    return (
      <div className="scrollable">
        {searchType === SEARCH_TYPES.PERSON
          ? renderPeopleTable()
          : renderOrganizationsTable()}
      </div>
    )
  }

  function renderOrganizationsTable() {
    return (
      <Table responsive hover striped id="user-activities">
        <thead>
          <tr>
            <th>Organization</th>
            <th>#{tableHeader}</th>
          </tr>
        </thead>
        <tbody>
          {userActivities.map(ua => (
            <tr key={ua.organizationUuid}>
              <td>
                <LinkTo
                  modelType="Organization"
                  model={ua.organization}
                  whenUnspecified={UNKNOWN_ORGANIZATION}
                />
              </td>
              <td>{ua.count}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  function renderPeopleTable() {
    return (
      <Table responsive hover striped id="user-activities">
        <thead>
          <tr>
            <th>Person</th>
            <th>#{tableHeader}</th>
          </tr>
        </thead>
        <tbody>
          {userActivities.map(ua => (
            <tr key={ua.personUuid}>
              <td>
                <LinkTo
                  modelType="Person"
                  model={ua.person}
                  whenUnspecified={DELETED_PERSON}
                />
              </td>
              <td>{ua.count}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  function startOfCurrentPeriod(period) {
    // always in UTC!
    return moment.utc().startOf(period)
  }

  function showNextPeriod(period) {
    setPageNum(0)
    changeStartDate(moment.utc(startDate).add(1, period).startOf(period))
  }

  function showPreviousPeriod(period) {
    setPageNum(0)
    changeStartDate(moment.utc(startDate).subtract(1, period).startOf(period))
  }

  function showToday(period) {
    setPageNum(0)
    changeStartDate(startOfCurrentPeriod(period))
  }

  function changeStartDate(newStartDate) {
    setUserActivitiesState({
      ...userActivitiesState,
      startDatePerPeriod: newStartDate
    })
    setStartDate(newStartDate)
  }

  function changePeriod(period) {
    setPageNum(0)
    changeStartDate(moment.utc(startDate).startOf(period))
    setUserActivitiesState({
      ...userActivitiesState,
      aggregationPeriod: period
    })
    setAggregationPeriod(period)
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
    setPageNum(0)
    setUserActivitiesState({
      ...userActivitiesState,
      showDeleted: !showDeleted
    })
    setShowDeleted(!showDeleted)
  }

  function changeSearchType(newSearchType) {
    setPageNum(0)
    setUserActivitiesState({
      ...userActivitiesState,
      searchType: newSearchType
    })
    setSearchType(newSearchType)
  }

  function changePageSize(newPageSize) {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }
}

UserActivitiesPerPeriod.propTypes = {
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
)(UserActivitiesPerPeriod)
