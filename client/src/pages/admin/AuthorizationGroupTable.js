import LinkTo from "components/LinkTo"
import { mapPageDispatchersToProps } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import { AuthorizationGroup } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

const AuthorizationGroupTable = ({
  id,
  authorizationGroups,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}) => {
  const ags = AuthorizationGroup.fromArray(authorizationGroups)

  const table = (
    <Table striped hover responsive id={id}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Members</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {ags.map(authorizationGroup => (
          <tr key={authorizationGroup.uuid}>
            <td>
              <LinkTo
                modelType="AuthorizationGroup"
                model={authorizationGroup}
              />
            </td>
            <td>{authorizationGroup.description}</td>
            <td>
              {authorizationGroup.authorizationGroupRelatedObjects.map(agro => (
                <div key={agro.relatedObjectUuid}>
                  <LinkTo
                    modelType={agro.relatedObjectType}
                    model={agro.relatedObject}
                  />
                </div>
              ))}
            </td>
            <td>{authorizationGroup.humanNameOfStatus()} </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
  return !goToPage ? (
    table
  ) : (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        {table}
      </UltimatePaginationTopDown>
    </div>
  )
}

AuthorizationGroupTable.propTypes = {
  id: PropTypes.string,
  // list of authorizationGroups:
  authorizationGroups: PropTypes.array.isRequired,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupTable)
