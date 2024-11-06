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
import { Location } from "models"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_GET_LOCATION_LIST = gql`
  query ($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        lat
        lng
        type
      }
    }
  }
`

interface LocationTableProps {
  // query variables for locations, when query & pagination wanted:
  queryParams?: any
}

const LocationTable = (props: LocationTableProps) => {
  if (props.queryParams) {
    return <PaginatedLocations {...props} />
  }
  return <BaseLocationTable {...props} />
}

interface PaginatedLocationsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const PaginatedLocations = ({
  queryParams,
  pageDispatchers,
  ...otherProps
}: PaginatedLocationsProps) => {
  const [pageNum, setPageNum] = useState(0)
  const locationQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION_LIST, {
    locationQuery
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
    list: locations
  } = data.locationList

  return (
    <BaseLocationTable
      locations={locations}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPageNum}
      {...otherProps}
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
  noLocationsMessage,
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
            {locations.map(loc => (
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

BaseLocationTable.defaultProps = {
  noLocationsMessage: "No locations found"
}

export default connect(null, mapPageDispatchersToProps)(LocationTable)
