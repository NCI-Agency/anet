import { gql } from "@apollo/client"
import API from "api"
import Checkbox from "components/Checkbox"
import EmailAddressList from "components/EmailAddressList"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RemoveButton from "components/RemoveButton"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import { Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        location {
          uuid
          name
        }
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
  showLocation,
  showOrganization,
  showOrganizationsAdministrated,
  showStatus,
  showDelete,
  onDelete,
  positions,
  pageSize,
  pageNum,
  totalCount,
  goToPage,
  allowSelection,
  selection,
  isAllSelected,
  toggleAll,
  isSelected,
  toggleSelection
}) => {
  if (_get(positions, "length", 0) === 0) {
    return <em>No positions found</em>
  }

  return (
    <div>
      {allowSelection && (
        <em className="float-start">{selection.size} selected</em>
      )}
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
              {allowSelection && (
                <>
                  <th style={{ verticalAlign: "middle", textAlign: "center" }}>
                    <Checkbox checked={isAllSelected()} onChange={toggleAll} />
                  </th>
                  <th>Email</th>
                </>
              )}
              <th>Name</th>
              {showLocation && <th>Location</th>}
              {showOrganization && <th>Organization</th>}
              {showOrganizationsAdministrated && <th>Superuser of</th>}
              <th>Current Occupant</th>
              {showStatus && <th>Status</th>}
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
                  {allowSelection && (
                    <>
                      <td
                        style={{ verticalAlign: "middle", textAlign: "center" }}
                      >
                        {!_isEmpty(pos.emailAddresses) && (
                          <Checkbox
                            checked={isSelected(pos.uuid)}
                            onChange={() =>
                              toggleSelection(pos.uuid, pos.emailAddresses)}
                          />
                        )}
                      </td>
                      <td>
                        <EmailAddressList
                          label={Settings.fields.position.emailAddresses.label}
                          emailAddresses={pos.emailAddresses}
                        />
                      </td>
                    </>
                  )}
                  <td>
                    <LinkTo modelType="Position" model={pos}>
                      {nameComponents.join(" - ")}
                    </LinkTo>
                  </td>
                  {showLocation && (
                    <td>
                      <LinkTo modelType="Location" model={pos.location} />
                    </td>
                  )}
                  {showOrganization && (
                    <td>
                      {pos.organization && (
                        <LinkTo
                          modelType="Organization"
                          model={pos.organization}
                        />
                      )}
                    </td>
                  )}
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
                  {showStatus && <td>{utils.sentenceCase(pos.status)}</td>}
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
  showLocation: PropTypes.bool,
  showOrganization: PropTypes.bool,
  showOrganizationsAdministrated: PropTypes.bool,
  showStatus: PropTypes.bool,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  // list of positions:
  positions: PropTypes.array.isRequired,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func,
  allowSelection: PropTypes.bool,
  // if allowSelection is true:
  selection: PropTypes.instanceOf(Map),
  isAllSelected: PropTypes.func,
  toggleAll: PropTypes.func,
  isSelected: PropTypes.func,
  toggleSelection: PropTypes.func
}

BasePositionTable.defaultProps = {
  showOrganization: true,
  showStatus: true
}

export default connect(null, mapPageDispatchersToProps)(PositionTable)
