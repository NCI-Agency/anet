import {
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import { Event } from "models"
import moment from "moment/moment"
import React, { useEffect, useRef, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_EVENT_LIST = gql`
  query ($eventQuery: EventSearchQueryInput) {
    eventList(query: $eventQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Event}
        startDate
        endDate
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        eventSeries {
          ${gqlEntityFieldsMap.EventSeries}
        }
        location {
          ${gqlEntityFieldsMap.Location}
        }
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

interface EventTableProps {
  // query variables for events, when query & pagination wanted:
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  id?: string
  events?: any[]
  showEventSeries?: boolean
}

const EventTable = (props: EventTableProps) => {
  if (props.queryParams) {
    return <PaginatedEvents {...props} />
  }
  return <BaseEventTable {...props} />
}

interface PaginatedEventsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  showStatus?: boolean
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
}

const PaginatedEvents = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  ...otherProps
}: PaginatedEventsProps) => {
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    (queryParamsUnchanged && pagination?.[paginationKey]?.pageNum) ?? 0
  )

  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      if (setPagination && paginationKey) {
        setPagination(paginationKey, 0)
      }
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])

  const eventQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })

  const { loading, error, data } = API.useApiQuery(GQL_GET_EVENT_LIST, {
    eventQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const totalCount = done ? null : data?.eventList?.totalCount
  useEffect(() => {
    if (setTotalCount) {
      setTotalCount(totalCount ?? 0)
    }
  }, [setTotalCount, totalCount])

  if (done) {
    return result
  }

  const { pageSize, pageNum: curPage, list: events } = data.eventList
  if (_get(events, "length", 0) === 0) {
    return <em>No events found</em>
  }

  function setPage(newPageNum: number) {
    if (setPagination && paginationKey) {
      setPagination(paginationKey, newPageNum)
    }
    setPageNum(newPageNum)
  }

  return (
    <BaseEventTable
      events={events}
      pageSize={setPagination && pageSize}
      pageNum={setPagination && curPage}
      totalCount={setPagination && totalCount}
      goToPage={setPagination && setPage}
      {...otherProps}
    />
  )
}

interface BaseEventTableProps {
  id?: string
  // list of events:
  events?: any[]
  noEventsMessage?: string
  // fill these when pagination wanted:
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
  showEventSeries?: boolean
}

const BaseEventTable = ({
  id,
  events,
  noEventsMessage = "No events found",
  pageSize,
  pageNum,
  totalCount,
  goToPage,
  showEventSeries
}: BaseEventTableProps) => {
  if (_get(events, "length", 0) === 0) {
    return <em>{noEventsMessage}</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table responsive hover striped id={id}>
          <thead>
            <tr>
              <th>{Settings.fields.event.name.label}</th>
              {showEventSeries && (
                <th>{Settings.fields.event.eventSeries.label}</th>
              )}
              <th>{Settings.fields.event.ownerOrg.label}</th>
              <th>{Settings.fields.event.location.label}</th>
              <th>{Settings.fields.event.startDate.label}</th>
              <th>{Settings.fields.event.endDate.label}</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.uuid}>
                <td>
                  <LinkTo modelType="Event" model={event} />
                </td>
                {showEventSeries && (
                  <td>
                    <LinkTo modelType="EventSeries" model={event.eventSeries} />
                  </td>
                )}
                <td>
                  <LinkTo modelType="Organization" model={event.ownerOrg} />
                </td>
                <td>
                  <LinkTo modelType="Location" model={event.location} />
                </td>
                <td>
                  {moment(event.startDate).format(Event.getEventDateFormat())}
                </td>
                <td>
                  {moment(event.endDate).format(Event.getEventDateFormat())}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventTable)
