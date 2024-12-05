import API from "api"
import LinkTo from "components/LinkTo"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import { EventSeries } from "models"
import React, { useEffect, useRef, useState } from "react"
import { Table } from "react-bootstrap"

const DEFAULT_PAGESIZE = 10

interface EventSeriesTableProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey: string
  pagination: any
  setPagination: (...args: unknown[]) => unknown
}

const EventSeriesTable = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}: EventSeriesTableProps) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const eventSeriesQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(
    EventSeries.getEventSeriesListQuery,
    {
      eventSeriesQuery
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.eventSeriesList?.totalCount
  useEffect(
    () => setTotalCount && setTotalCount(totalCount),
    [setTotalCount, totalCount]
  )
  if (done) {
    return result
  }

  const eventSeries = data
    ? EventSeries.fromArray(data.eventSeriesList.list)
    : []
  if (_get(eventSeries, "length", 0) === 0) {
    return <em>No event series found</em>
  }

  const { pageSize } = data.eventSeriesList

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPage}
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

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

export default EventSeriesTable
