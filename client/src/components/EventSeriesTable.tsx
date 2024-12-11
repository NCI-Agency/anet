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
import { EventSeries } from "models"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_EVENTSERIES_LIST = gql`
  query ($eventSeriesQuery: EventSeriesSearchQueryInput) {
    eventSeriesList(query: $eventSeriesQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        hostOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        adminOrg {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
  }
`

interface EventSeriesTableProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const EventSeriesTable = ({
  pageDispatchers,
  queryParams
}: EventSeriesTableProps) => {
  const [pageNum, setPageNum] = useState(0)
  const eventSeriesQuery = { ...queryParams, pageNum }
  const { loading, error, data } = API.useApiQuery(GQL_GET_EVENTSERIES_LIST, {
    eventSeriesQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const eventSeries = data
    ? EventSeries.fromArray(data.eventSeriesList.list)
    : []
  if (_get(eventSeries, "length", 0) === 0) {
    return <em>No event series found</em>
  }

  const { pageSize, pageNum: curPage, totalCount } = data.eventSeriesList

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageNum={curPage}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPageNum}
      >
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Host Organization</th>
              <th>Admin Organization</th>
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
