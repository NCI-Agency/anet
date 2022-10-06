import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import "@blueprintjs/core/lib/css/blueprint.css"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import BarChart from "components/BarChart"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import Checkbox from "components/Checkbox"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import MosaicLayout from "components/MosaicLayout"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import _escape from "lodash/escape"
import moment from "moment"
import React, { useState } from "react"
import { Button, FormSelect, Table } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"
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
          role
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
  day: "D MMMM YYYY",
  week: "[week] W YYYY",
  month: "MMMM YYYY"
}
const DEFAULT_AGGREGATION_PERIOD = "month"
const SEARCH_TYPES = {
  PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION",
  TOP_LEVEL_ORGANIZATION: "TOP_LEVEL_ORGANIZATION"
}
const DEFAULT_SEARCH_TYPE = SEARCH_TYPES.TOP_LEVEL_ORGANIZATION
const GQL_QUERIES = {
  [SEARCH_TYPES.PERSON]: GQL_GET_USER_ACTIVITY_LIST_BY_PERSON,
  [SEARCH_TYPES.ORGANIZATION]: GQL_GET_USER_ACTIVITY_LIST_BY_ORGANIZATION,
  [SEARCH_TYPES.TOP_LEVEL_ORGANIZATION]:
    GQL_GET_USER_ACTIVITY_LIST_BY_ORGANIZATION
}

const UserActivities = ({ pageDispatchers }) => {
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [aggregationPeriod, setAggregationPeriod] = useState(
    DEFAULT_AGGREGATION_PERIOD
  )
  const [startDate, setStartDate] = useState(
    startOfCurrentPeriod(aggregationPeriod)
  )
  const [searchType, setSearchType] = useState(DEFAULT_SEARCH_TYPE)
  const [showDeleted, setShowDeleted] = useState(false)
  const userActivityQuery = {
    pageNum,
    pageSize,
    startDate,
    endDate: moment(startDate).endOf(aggregationPeriod),
    searchType,
    showDeleted
  }
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
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
  }`
  const VISUALIZATIONS = [
    {
      id: "ua-table",
      icons: [IconNames.PANEL_TABLE],
      title: `Activity by ${utils.noCase(searchType)}`,
      renderer: renderTable
    },
    {
      id: "ua-chart",
      icons: [IconNames.GROUPED_BAR_CHART],
      title: `Chart by ${utils.noCase(searchType)}`,
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
              {moment(userActivityQuery.startDate).format(
                AGGREGATION_DATE_FORMATS[aggregationPeriod]
              )}
              , total this period: {totalCount}
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
                      {ap}
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
                  Today
                </Button>
                <div className="d-flex align-items-center">
                  <FormSelect
                    className="me-1"
                    defaultValue={searchType}
                    onChange={e =>
                      changeSearchType(e.target.value || DEFAULT_SEARCH_TYPE)
                    }
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
                    )
                  }
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
      <div className="non-scrollable">
        <ContainerDimensions>
          {({ width, height }) => (
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
          )}
        </ContainerDimensions>
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
            <th>#minutes active</th>
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
            <th>#minutes active</th>
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
    setStartDate(moment(startDate).add(1, period).startOf(period))
  }

  function showPreviousPeriod(period) {
    setPageNum(0)
    setStartDate(moment(startDate).subtract(1, period).startOf(period))
  }

  function showToday(period) {
    setPageNum(0)
    setStartDate(startOfCurrentPeriod(period))
  }

  function changePeriod(period) {
    setPageNum(0)
    setStartDate(moment(startDate).startOf(period))
    setAggregationPeriod(period)
  }

  function toggleShowDeleted() {
    setPageNum(0)
    setShowDeleted(!showDeleted)
  }

  function changeSearchType(newSearchType) {
    setPageNum(0)
    setSearchType(newSearchType)
  }

  function changePageSize(newPageSize) {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }
}

UserActivities.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(UserActivities)
