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
import { EventSeries } from "models"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_EVENTSERIES_LIST = gql`
  query ($eventSeriesQuery: EventSeriesSearchQueryInput) {
    eventSeriesList(query: $eventSeriesQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.EventSeries}
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        hostOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
      }
    }
  }
`

interface EventSeriesTableProps {
  queryParams?: any
}

const EventSeriesTable = (props: EventSeriesTableProps) => {
  if (props.queryParams) {
    return <PaginatedEventSeries {...props} />
  }
  return <BaseEventSeriesTable {...props} />
}

interface PaginatedEventSeriesProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const PaginatedEventSeries = ({
  pageDispatchers,
  queryParams,
  ...otherProps
}: PaginatedEventSeriesProps) => {
  const [pageNum, setPageNum] = useState(0)
  const eventSeriesQuery = { ...queryParams, pageNum }
  const { loading, error, data } = API.useApiQuery(GQL_GET_EVENTSERIES_LIST, {
    eventSeriesQuery
  })
  const { done, result } = useBoilerplate({ loading, error, pageDispatchers })
  if (done) {
    return result
  }

  const { pageSize, pageNum: curPage, totalCount, list } = data.eventSeriesList

  const eventSeries = EventSeries.fromArray(list)

  return (
    <BaseEventSeriesTable
      eventSeries={eventSeries}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPageNum}
      {...otherProps}
    />
  )
}

interface BaseEventSeriesTableProps {
  eventSeries?: EventSeries[]
  noEventSeriesMessage?: string
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
}

const BaseEventSeriesTable = ({
  eventSeries,
  noEventSeriesMessage = "No event series found",
  pageSize,
  pageNum,
  totalCount,
  goToPage
}: BaseEventSeriesTableProps) => {
  if (_get(eventSeries, "length", 0) === 0) {
    return <em>{noEventSeriesMessage}</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>{Settings.fields.eventSeries.name.label}</th>
              <th>{Settings.fields.eventSeries.ownerOrg.label}</th>
              <th>{Settings.fields.eventSeries.hostOrg.label}</th>
              <th>{Settings.fields.eventSeries.adminOrg.label}</th>
            </tr>
          </thead>
          <tbody>
            {eventSeries.map(eventSeries => (
              <tr key={eventSeries.uuid}>
                <td>
                  <LinkTo modelType="EventSeries" model={eventSeries} />
                </td>
                <td>
                  <LinkTo
                    modelType="Organization"
                    model={eventSeries.ownerOrg}
                  />
                </td>
                <td>
                  <LinkTo
                    modelType="Organization"
                    model={eventSeries.hostOrg}
                  />
                </td>
                <td>
                  <LinkTo
                    modelType="Organization"
                    model={eventSeries.adminOrg}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventSeriesTable)
