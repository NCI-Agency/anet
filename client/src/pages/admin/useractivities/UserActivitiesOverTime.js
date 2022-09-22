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
import MosaicLayout from "components/MosaicLayout"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import _escape from "lodash/escape"
import moment from "moment"
import React, { useState } from "react"
import { Button, FormSelect, Table } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"
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
const SEARCH_TYPES = {
  PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION",
  TOP_LEVEL_ORGANIZATION: "TOP_LEVEL_ORGANIZATION"
}
const DEFAULT_SEARCH_TYPE = SEARCH_TYPES.TOP_LEVEL_ORGANIZATION
const DEFAULT_TIME_WINDOW = 5

const UserActivitiesOverTime = ({ pageDispatchers }) => {
  const [aggregationPeriod, setAggregationPeriod] = useState(
    DEFAULT_AGGREGATION_PERIOD
  )
  const [startDate, setStartDate] = useState(
    startOfCurrentPeriod(aggregationPeriod)
  )
  const endDate = moment(startDate)
    .add(DEFAULT_TIME_WINDOW, aggregationPeriod)
    .endOf(aggregationPeriod)
  const [searchType, setSearchType] = useState(DEFAULT_SEARCH_TYPE)
  const [showDeleted, setShowDeleted] = useState(false)
  const userActivityQuery = {
    pageNum: 0,
    pageSize: DEFAULT_TIME_WINDOW + 1,
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
          <div>
            <h2>
              User Activities over time from{" "}
              {moment(userActivityQuery.startDate).format(
                AGGREGATION_DATE_FORMATS[aggregationPeriod]
              )}{" "}
              until{" "}
              {moment(userActivityQuery.endDate).format(
                AGGREGATION_DATE_FORMATS[aggregationPeriod]
              )}
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
      <div className="non-scrollable">
        <ContainerDimensions>
          {({ width, height }) => (
            <BarChart
              width={width}
              height={height}
              chartId="user_activity_chart"
              data={userActivities}
              xProp="visitedAt"
              yProp="count"
              xLabel="dateLabel"
              tooltip={tooltip}
            />
          )}
        </ContainerDimensions>
      </div>
    )
  }

  function renderTable() {
    return (
      <Table responsive hover striped id="user-activities">
        <thead>
          <tr>
            <th>Period</th>
            <th>#total active</th>
          </tr>
        </thead>
        <tbody>
          {userActivities.map(ua => (
            <tr key={ua.label}>
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
    )
  }

  function startOfCurrentPeriod(period) {
    // always in UTC!
    return moment.utc().subtract(DEFAULT_TIME_WINDOW, period).startOf(period)
  }

  function showNextPeriod(period) {
    setStartDate(moment(startDate).add(1, period).startOf(period))
  }

  function showPreviousPeriod(period) {
    setStartDate(moment(startDate).subtract(1, period).startOf(period))
  }

  function showToday(period) {
    setStartDate(startOfCurrentPeriod(period))
  }

  function changePeriod(period) {
    const end = moment.utc(endDate).endOf(period)
    const now = moment.utc()
    setStartDate(moment.min(now, end).subtract(DEFAULT_TIME_WINDOW, period).startOf(period))
    setAggregationPeriod(period)
  }

  function toggleShowDeleted() {
    setShowDeleted(!showDeleted)
  }

  function changeSearchType(newSearchType) {
    setSearchType(newSearchType)
  }
}

UserActivitiesOverTime.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(UserActivitiesOverTime)
