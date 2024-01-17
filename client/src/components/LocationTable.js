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
import { Location } from "models"
import PropTypes from "prop-types"
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

const LocationTable = props => {
  if (props.queryParams) {
    return <PaginatedLocations {...props} />
  }
  return <BaseLocationTable {...props} />
}

LocationTable.propTypes = {
  // query variables for locations, when query & pagination wanted:
  queryParams: PropTypes.object
}

const PaginatedLocations = ({
  queryParams,
  pageDispatchers,
  ...otherProps
}) => {
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

PaginatedLocations.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object
}

const BaseLocationTable = ({
  id,
  showDelete,
  onDelete,
  locations,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}) => {
  if (_get(locations, "length", 0) === 0) {
    return <em>No locations found</em>
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
            </tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc.uuid}>
                <td>
                  <LinkTo modelType="Location" model={loc} />
                </td>
                <td>{Location.humanNameOfType(loc.type)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

BaseLocationTable.propTypes = {
  id: PropTypes.string,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  // list of locations:
  locations: PropTypes.array.isRequired,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(LocationTable)
