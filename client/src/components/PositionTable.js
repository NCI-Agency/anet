import API from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
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
  if (props.positions) {
    return <BasePositionTable {...props} />
  }
  return <PaginatedPositions {...props} />
}

PositionTable.propTypes = {
  positions: PropTypes.array // list of positions, when no pagination wanted
}

const PaginatedPositions = props => {
  const { queryParams, ...otherProps } = props
  const [pageNum, setPageNum] = useState(0)
  const positionQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_POSITION_LIST, {
    positionQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const paginatedPositions = data.positionList

  return (
    <BasePositionTable
      paginatedPositions={paginatedPositions}
      goToPage={setPageNum}
      {...otherProps}
    />
  )
}

PaginatedPositions.propTypes = {
  queryParams: PropTypes.object // query variables for positions, when pagination wanted
}

const BasePositionTable = props => {
  let positions
  if (props.paginatedPositions) {
    var { pageSize, pageNum, totalCount } = props.paginatedPositions
    positions = props.paginatedPositions.list
    pageNum++
  } else {
    positions = props.positions
  }

  if (_get(positions, "length", 0) === 0) {
    return <em>No positions found</em>
  }

  const tableElement = (
    <Table striped condensed hover responsive className="positions_table">
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
          let nameComponents = []
          pos.name && nameComponents.push(pos.name)
          pos.code && nameComponents.push(pos.code)
          return (
            <tr key={pos.uuid}>
              <td>
                <LinkTo position={pos}>{nameComponents.join(" - ")}</LinkTo>
              </td>
              <td>
                <LinkTo anetLocation={pos.location} />
              </td>
              <td>
                {pos.organization && <LinkTo organization={pos.organization} />}
              </td>
              <td>{pos.person && <LinkTo person={pos.person} />}</td>
              <td>{utils.sentenceCase(pos.status)}</td>
              {props.showDelete && (
                <td
                  onClick={() => props.onDelete(pos)}
                  id={"positionDelete_" + pos.uuid}
                >
                  <span style={{ cursor: "pointer" }}>
                    <img src={REMOVE_ICON} height={14} alt="Remove position" />
                  </span>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
  return (
    <div>
      <UltimatePaginationTopDown
        Component="header"
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={props.goToPage}
        contentElement={tableElement}
      />
    </div>
  )
}

BasePositionTable.propTypes = {
  positions: PropTypes.array, // list of positions, when no pagination wanted
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  paginatedPositions: PropTypes.shape({
    totalCount: PropTypes.number,
    pageNum: PropTypes.number,
    pageSize: PropTypes.number,
    list: PropTypes.array.isRequired
  }),
  goToPage: PropTypes.func
}

export default connect(
  null,
  mapDispatchToProps
)(PositionTable)
