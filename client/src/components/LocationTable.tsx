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
import RemoveButton from "components/RemoveButton"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import { Location } from "models"
import React, { useEffect, useRef, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_LOCATION_LIST = gql`
  query ($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Location}
        lat
        lng
        type
      }
    }
  }
`

const DEFAULT_PAGESIZE = 10

interface LocationTableProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  id?: string
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
}

const LocationTable = (props: LocationTableProps) => {
  const { queryParams } = props
  if (queryParams) {
    return <LocationTableWithQuery {...props} />
  }
  return <BaseLocationTable {...props} />
}

const LocationTableWithQuery = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  id,
  showDelete,
  onDelete
}: LocationTableProps) => {
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    (queryParamsUnchanged && pagination?.[paginationKey!]?.pageNum) ?? 0
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

  const locationQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })

  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION_LIST, {
    locationQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const totalCount = done ? null : data?.locationList?.totalCount
  useEffect(() => {
    if (setTotalCount) {
      setTotalCount(totalCount)
    }
  }, [setTotalCount, totalCount])

  if (done) {
    return result
  }

  const paginatedLocations = data ? data.locationList : []
  const { pageSize, pageNum: curPage, list: locations } = paginatedLocations
  if (_get(locations, "length", 0) === 0) {
    return <em>No locations found</em>
  }

  function setPage(newPageNum: number) {
    if (setPagination && paginationKey) {
      setPagination(paginationKey, newPageNum)
    }
    setPageNum(newPageNum)
  }

  return (
    <BaseLocationTable
      id={id}
      showDelete={showDelete}
      onDelete={onDelete}
      locations={locations}
      pageSize={setPagination && pageSize}
      pageNum={setPagination && curPage}
      totalCount={setPagination && totalCount}
      goToPage={setPagination && setPage}
    />
  )
}

interface BaseLocationTableProps {
  id?: string
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  // list of locations:
  locations: any[]
  noLocationsMessage?: string
  // fill these when pagination wanted:
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
}

const BaseLocationTable = ({
  id,
  showDelete,
  onDelete,
  locations,
  noLocationsMessage = "No locations found",
  pageSize,
  pageNum,
  totalCount,
  goToPage
}: BaseLocationTableProps) => {
  if (_get(locations, "length", 0) === 0) {
    return <em>{noLocationsMessage}</em>
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
              <th>Name</th>
              <th>Type</th>
              {showDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {Location.map(locations, loc => (
              <tr key={loc.uuid}>
                <td>
                  <LinkTo modelType="Location" model={loc} />
                </td>
                <td>{Location.humanNameOfType(loc.type)}</td>
                {showDelete && (
                  <td id={"locationDelete_" + loc.uuid}>
                    <RemoveButton
                      title="Remove location"
                      onClick={() => onDelete(loc)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(LocationTable)
