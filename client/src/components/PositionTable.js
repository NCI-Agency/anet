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
import { Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import utils from "utils"

const GQL_GET_POSITION_LIST = gql`
  query ($positionQuery: PositionSearchQueryInput) {
    positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        role
        status
        organization {
          uuid
          shortName
          longName
          identificationCode
        }
        location {
          uuid
          name
        }
        person {
          uuid
          name
          rank
          role
          avatarUuid
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
  showOrganizationsAdministrated,
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
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table striped hover responsive className="positions_table" id={id}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Organization</th>
              {showOrganizationsAdministrated && <th>Superuser of</th>}
              <th>Current Occupant</th>
              <th>Status</th>
              {showDelete && <th />}
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
                  {showOrganizationsAdministrated && (
                    <td>
                      {pos.organizationsAdministrated?.map((o, i) => (
                        <React.Fragment key={o.uuid}>
                          {i > 0 && ", "}
                          <LinkTo modelType="Organization" model={o} />
                        </React.Fragment>
                      ))}
                    </td>
                  )}
                  <td>
                    {pos.person && (
                      <LinkTo modelType="Person" model={pos.person} />
                    )}
                  </td>
                  <td>{utils.sentenceCase(pos.status)}</td>
                  {showDelete && (
                    <td id={"positionDelete_" + pos.uuid}>
                      <RemoveButton
                        title="Remove position"
                        onClick={() => onDelete(pos)}
                      />
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
  showOrganizationsAdministrated: PropTypes.bool,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(PositionTable)
