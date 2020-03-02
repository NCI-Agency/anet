import API from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import REMOVE_ICON from "resources/delete.png"
import utils from "utils"

const GQL_GET_POSITION_LIST = gql`
  query($positionQuery: PositionSearchQueryInput) {
    positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        status
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
    }
  }
`

const PositionTable = props => {
  if (props.queryParams) {
    return <PaginatedPositions {...props} />
  }
  return <BasePositionTable {...props} />
}

PositionTable.propTypes = {
  // query variables for positions, when query & pagination wanted:
  queryParams: PropTypes.object
}

const PaginatedPositions = ({
  queryParams,
  pageDispatchers,
  ...otherProps
}) => {
  const [pageNum, setPageNum] = useState(0)
  const positionQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_POSITION_LIST, {
    positionQuery
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
    list: positions
  } = data.positionList

  return (
    <BasePositionTable
      positions={positions}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPageNum}
      {...otherProps}
    />
  )
}

PaginatedPositions.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object
}

const BasePositionTable = ({
  id,
  showDelete,
  onDelete,
  positions,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}) => {
  if (_get(positions, "length", 0) === 0) {
    return <em>No positions found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table
          striped
          condensed
          hover
          responsive
          className="positions_table"
          id={id}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Organization</th>
              <th>Current Occupant</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Position.map(positions, pos => {
              const nameComponents = []
              pos.name && nameComponents.push(pos.name)
              pos.code && nameComponents.push(pos.code)
              return (
                <tr key={pos.uuid}>
                  <td>
                    <LinkTo modelType="Position" model={pos}>
                      {nameComponents.join(" - ")}
                    </LinkTo>
                  </td>
                  <td>
                    <LinkTo modelType="Location" model={pos.location} />
                  </td>
                  <td>
                    {pos.organization && (
                      <LinkTo
                        modelType="Organization"
                        model={pos.organization}
                      />
                    )}
                  </td>
                  <td>
                    {pos.person && (
                      <LinkTo modelType="Person" model={pos.person} />
                    )}
                  </td>
                  <td>{utils.sentenceCase(pos.status)}</td>
                  {showDelete && (
                    <td
                      onClick={() => onDelete(pos)}
                      id={"positionDelete_" + pos.uuid}
                    >
                      <span style={{ cursor: "pointer" }}>
                        <img
                          src={REMOVE_ICON}
                          height={14}
                          alt="Remove position"
                        />
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

BasePositionTable.propTypes = {
  id: PropTypes.string,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  // list of positions:
  positions: PropTypes.array.isRequired,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(PositionTable)
