import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { Event } from "models"
import moment from "moment/moment"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_EVENT_LIST = gql`
  query ($eventQuery: EventSearchQueryInput) {
    eventList(query: $eventQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        type
        name
        startDate
        endDate
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ownerOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        eventSeries {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        location {
          uuid
          name
          lat
          lng
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
  }
`

interface EventTableProps {
  // query variables for events, when query & pagination wanted:
  queryParams?: any
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
}

const PaginatedEvents = ({
  pageDispatchers,
  queryParams,
  ...otherProps
}: PaginatedEventsProps) => {
  const [pageNum, setPageNum] = useState(0)
  const eventQuery = { ...queryParams, pageNum }
  const { loading, error, data } = API.useApiQuery(GQL_GET_EVENT_LIST, {
    eventQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const {
    pageSize,
    pageNum: curPage,
    totalCount,
    list: events
  } = data.eventList

  return (
    <BaseEventTable
      events={events}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPageNum}
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
