import Checkbox from "components/Checkbox"
import EmailAddressList from "components/EmailAddressList"
import LinkTo from "components/LinkTo"
import { mapPageDispatchersToProps } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { AuthorizationGroup } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const AuthorizationGroupTable = ({
  id,
  authorizationGroups,
  showMembers,
  showStatus,
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
  if (_get(authorizationGroups, "length", 0) === 0) {
    return <em>No authorization groups found</em>
  }

  const ags = AuthorizationGroup.fromArray(authorizationGroups)
  const table = (
    <Table striped hover responsive id={id}>
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
          <th>{Settings.fields.authorizationGroup.name?.label}</th>
          <th>{Settings.fields.authorizationGroup.description?.label}</th>
          {showMembers && (
            <th>
              {
                Settings.fields.authorizationGroup
                  .authorizationGroupRelatedObjects?.label
              }
            </th>
          )}
          {showStatus && (
            <th>{Settings.fields.authorizationGroup.status?.label}</th>
          )}
        </tr>
      </thead>

      <tbody>
        {ags.map(authorizationGroup => (
          <tr key={authorizationGroup.uuid}>
            {allowSelection && (
              <>
                <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                  <Checkbox
                    checked={isSelected(authorizationGroup.uuid)}
                    onChange={() => toggleSelection(authorizationGroup.uuid)}
                  />
                </td>
                <td>
                  {authorizationGroup.authorizationGroupRelatedObjects.map(
                    agro => (
                      <EmailAddressList
                        key={agro.relatedObjectUuid}
                        emailAddresses={agro.relatedObject?.emailAddresses}
                      />
                    )
                  )}
                </td>
              </>
            )}
            <td>
              <LinkTo
                modelType="AuthorizationGroup"
                model={authorizationGroup}
              />
            </td>
            <td>{authorizationGroup.description}</td>
            {showMembers && (
              <td>
                {authorizationGroup.authorizationGroupRelatedObjects.map(
                  agro => (
                    <div key={agro.relatedObjectUuid}>
                      <LinkTo
                        modelType={agro.relatedObjectType}
                        model={agro.relatedObject}
                      />
                    </div>
                  )
                )}
              </td>
            )}
            {showStatus && <td>{authorizationGroup.humanNameOfStatus()} </td>}
          </tr>
        ))}
      </tbody>
    </Table>
  )
  return !goToPage ? (
    table
  ) : (
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
        {table}
      </UltimatePaginationTopDown>
    </div>
  )
}

AuthorizationGroupTable.propTypes = {
  id: PropTypes.string,
  // list of authorizationGroups:
  authorizationGroups: PropTypes.array.isRequired,
  // optional columns
  showMembers: PropTypes.bool,
  showStatus: PropTypes.bool,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func,
  allowSelection: PropTypes.bool,
  // if allowSelection is true:
  selection: PropTypes.instanceOf(Set),
  isAllSelected: PropTypes.func,
  toggleAll: PropTypes.func,
  isSelected: PropTypes.func,
  toggleSelection: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupTable)
