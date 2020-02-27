import {
  DEFAULT_PAGE_PROPS,
  DEFAULT_SEARCH_PROPS,
  DEFAULT_SEARCH_QUERY,
  SEARCH_OBJECT_TYPES,
  setSearchQuery
} from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { SearchQueryPropType, getSearchQuery } from "components/SearchFilters"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useEffect, useMemo, useState } from "react"
import { Panel, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import { deserializeQueryParams } from "searchUtils"

const GQL_GET_REPORT_LISTS = gql`
  query(
    $reportQuery: ReportSearchQueryInput
    $reportPreviousQuery: ReportSearchQueryInput
  ) {
    currentList: reportList(query: $reportQuery) {
      list {
        uuid
        location {
          uuid
        }
        attendees {
          position {
            uuid
          }
        }
      }
    }
    previousList: reportList(query: $reportPreviousQuery) {
      list {
        uuid
        location {
          uuid
        }
        attendees {
          position {
            uuid
          }
        }
      }
    }
  }
`
// TODO: replace this with a way ask graphql for the content of a set of UUIDs
const GQL_GET_STATIC_DATA = gql`
  query(
    $positionQuery: PositionSearchQueryInput
    $locationQuery: LocationSearchQueryInput
    $taskQuery: TaskSearchQueryInput
  ) {
    positionList(query: $positionQuery) {
      list {
        uuid
        name
      }
    }
    locationList(query: $locationQuery) {
      list {
        uuid
        name
      }
    }
    taskList(query: $taskQuery) {
      list {
        uuid
        shortName
      }
    }
  }
`

const _SEARCH_PROPS = Object.assign({}, DEFAULT_SEARCH_PROPS, {
  onSearchGoToSearchPage: false,
  searchObjectTypes: [SEARCH_OBJECT_TYPES.REPORTS]
})

const DecisivesDashboard = ({ pageDispatchers }) => {
  const { dashboard } = useParams()
  const dashboardSettings = Settings.dashboards.find(o => o.label === dashboard)
  const [dashboardData, setDashboardData] = useState([])
  useEffect(() => {
    async function fetchData() {
      await fetch(dashboardSettings.data)
        .then(response => response.json())
        .then(setDashboardData)
    }
    fetchData()
  }, [dashboardSettings.data])

  return (
    <DecisivesDashboardStatic
      dashboardData={dashboardData}
      pageDispatchers={pageDispatchers}
    />
  )
}

DecisivesDashboard.propTypes = { pageDispatchers: PageDispatchersPropType }

const DecisivesDashboardStatic = ({ dashboardData, pageDispatchers }) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_STATIC_DATA, {
    positionQuery: {
      // TODO: make this work with AbstractSearchQueryInput
      pageNum: 0,
      pageSize: 0,
      status: "ACTIVE"
    },
    locationQuery: {
      pageNum: 0,
      pageSize: 0,
      status: "ACTIVE"
    },
    taskQuery: {
      pageNum: 0,
      pageSize: 0,
      status: "ACTIVE"
    }
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  const decisives = useMemo(() => {
    if (!data || !dashboardData) {
      return []
    }
    return dashboardData.map(decisive => {
      return {
        label: decisive.label,
        positions: data.positionList.list.filter(item =>
          decisive.positions.includes(item.uuid)
        ),
        tasks: data.taskList.list.filter(item =>
          decisive.tasks.includes(item.uuid)
        ),
        locations: data.locationList.list.filter(item =>
          decisive.locations.includes(item.uuid)
        )
      }
    })
  }, [dashboardData, data])
  if (done) {
    return result
  }

  return _isEmpty(dashboardData) ? null : (
    <DecisivesDashboardImpl
      decisives={decisives}
      pageDispatchers={pageDispatchers}
    />
  )
}

DecisivesDashboardStatic.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  dashboardData: PropTypes.array
}

const BaseDecisivesDashboardImpl = ({
  decisives,
  searchQuery,
  setSearchQuery,
  pageDispatchers
}) => {
  let queryParams
  if (searchQuery === DEFAULT_SEARCH_QUERY) {
    // when going from a different page to the decisives page, use the default
    // decisives search query
    queryParams = setDecisivesDefaultSearchQuery()
  } else {
    queryParams = getSearchQuery(searchQuery)
  }
  const prevQueryParams = {
    ...queryParams,
    engagementDateEnd: queryParams.engagementDateStart,
    engagementDateStart:
      2 * queryParams.engagementDateStart - queryParams.engagementDateEnd
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT_LISTS, {
    reportQuery: {
      pageNum: 0,
      pageSize: 0,
      ...queryParams
    },
    reportPreviousQuery: {
      pageNum: 0,
      pageSize: 0,
      ...prevQueryParams
    }
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: _SEARCH_PROPS,
    pageDispatchers
  })
  const [reportStats, prevReportStats] = useMemo(() => {
    if (!data) {
      return []
    }
    const currentReports = data.currentList.list || []
    const currentStats = currentReports.reduce(
      (counter, report) => {
        counter.locationStats[report.location.uuid] =
          ++counter.locationStats[report.location.uuid] || 1
        report.attendees.reduce((counterNested, attendee) => {
          if (attendee.position) {
            counterNested.positionStats[attendee.position.uuid] =
              ++counterNested.positionStats[attendee.position.uuid] || 1
          }
          return counterNested
        }, counter)
        return counter
      },
      { locationStats: {}, positionStats: {} }
    )
    const previousReports = data.previousList.list || []
    const previousStats = previousReports.reduce(
      (counter, report) => {
        counter.locationStats[report.location.uuid] =
          ++counter.locationStats[report.location.uuid] || 1
        report.attendees.reduce((counterNested, attendee) => {
          if (attendee.position) {
            counterNested.positionStats[attendee.position.uuid] =
              ++counterNested.positionStats[attendee.position.uuid] || 1
          }
          return counterNested
        }, counter)
        return counter
      },
      { locationStats: {}, positionStats: {} }
    )
    return [currentStats, previousStats]
  }, [data])
  if (done) {
    return result
  }
  if (!data) {
    return null
  }

  return (
    <>
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">People</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          {decisives.map(decisive => (
            <StatsTable
              label={decisive.label}
              key={decisive.label}
              data={decisive.positions}
              contentData={reportStats.positionStats}
              prevContentData={prevReportStats.positionStats}
              itemLabel={item => <LinkTo position={item}>{item.name}</LinkTo>}
            />
          ))}
        </Panel.Body>
      </Panel>
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">Places</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          {decisives.map(decisive => (
            <StatsTable
              label={decisive.label}
              key={decisive.label}
              data={decisive.locations}
              contentData={reportStats.locationStats}
              prevContentData={prevReportStats.locationStats}
              itemLabel={item => (
                <LinkTo anetLocation={item}>{item.name}</LinkTo>
              )}
            />
          ))}
        </Panel.Body>
      </Panel>
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">Processes</Panel.Title>
        </Panel.Heading>
        <Panel.Body>{/* <StatsTable data={[]} /> */}</Panel.Body>
      </Panel>
    </>
  )

  function setDecisivesDefaultSearchQuery() {
    const queryParams = {
      state: [Report.STATE.PUBLISHED],
      engagementDateStart: moment()
        .subtract(8, "d")
        .endOf("day")
        .valueOf(),
      engagementDateEnd: moment()
        .subtract(1, "d")
        .endOf("day")
        .valueOf()
    }
    deserializeQueryParams(
      SEARCH_OBJECT_TYPES.REPORTS,
      queryParams,
      deserializeCallback
    )
    return queryParams
  }

  function deserializeCallback(objectType, filters, text) {
    // We update the Redux state
    setSearchQuery({
      objectType: objectType,
      filters: filters,
      text: text
    })
  }
}

BaseDecisivesDashboardImpl.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  searchQuery: SearchQueryPropType,
  setSearchQuery: PropTypes.func.isRequired,
  decisives: PropTypes.array
}

const mapStateToProps = (state, ownProps) => ({
  searchQuery: state.searchQuery
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery))
})

const DecisivesDashboardImpl = connect(
  mapStateToProps,
  mapDispatchToProps
)(BaseDecisivesDashboardImpl)

const StatsTable = ({
  data,
  itemLabel,
  label,
  contentData,
  prevContentData
}) => (
  <Table responsive>
    <thead>
      <tr>
        <th>{label}</th>
        {data.map(item => (
          <th key={item.uuid}>{itemLabel(item)}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td />
        {data.map(item => {
          const previous = prevContentData[item.uuid] || 0
          const current = contentData[item.uuid] || 0
          const color =
            current > 1.3 * previous
              ? "green"
              : current < 0.7 * previous
                ? "red"
                : "white"
          return (
            <td bgcolor={color} key={item.uuid}>
              {current}/{previous}
            </td>
          )
        })}
      </tr>
    </tbody>
  </Table>
)

StatsTable.propTypes = {
  data: PropTypes.array.isRequired,
  itemLabel: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  contentData: PropTypes.object.isRequired,
  prevContentData: PropTypes.object.isRequired
}

export default connect(null, mapPageDispatchersToProps)(DecisivesDashboard)
