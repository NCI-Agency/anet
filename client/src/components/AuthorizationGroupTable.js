import Checkbox from "components/Checkbox"
import LinkTo from "components/LinkTo"
import { mapPageDispatchersToProps } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { AuthorizationGroup } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"
import utils from "utils"

const TruncatedList = ({ elementType, elements, maxLines, renderElement }) => {
  const n = elements?.length ?? 0
  if (!utils.isNumeric(maxLines) || n <= maxLines) {
    return elements?.map(renderElement)
  }
  if (maxLines === 0 || maxLines === 1) {
    return (
      <em>
        {n} {n === 1 ? elementType : pluralize(elementType)}
      </em>
    )
  }
  const elems = []
  const toShow = maxLines - 1
  for (let i = 0; i < toShow; i++) {
    elems.push(renderElement(elements[i]))
  }
  elems.push(<div key="more">… and {n - toShow} more</div>)
  return elems
}

TruncatedList.propTypes = {
  elementType: PropTypes.string.isRequired,
  elements: PropTypes.array,
  maxLines: PropTypes.number,
  renderElement: PropTypes.func.isRequired
}

TruncatedList.defaultProps = {
  maxLines: 0
}

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
        {ags.map(authorizationGroup => {
          const agEmailAddresses =
            authorizationGroup.authorizationGroupRelatedObjects.flatMap(agro =>
              agro.relatedObject?.emailAddresses?.map(ea => ({
                key: agro.relatedObjectUuid,
                ...ea
              }))
            )
          return (
            <tr key={authorizationGroup.uuid}>
              {allowSelection && (
                <>
                  <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                    <Checkbox
                      checked={isSelected(authorizationGroup.uuid)}
                      onChange={() =>
                        toggleSelection(
                          authorizationGroup.uuid,
                          agEmailAddresses
                        )}
                    />
                  </td>
                  <td>
                    <TruncatedList
                      elementType="email address"
                      elements={agEmailAddresses}
                      renderElement={ea => (
                        <div key={ea.key}>
                          {utils.createMailtoLink(ea.address)}
                        </div>
                      )}
                    />
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
                  <TruncatedList
                    elementType="member"
                    elements={
                      authorizationGroup.authorizationGroupRelatedObjects
                    }
                    renderElement={agro => (
                      <div key={agro.relatedObjectUuid}>
                        <LinkTo
                          modelType={agro.relatedObjectType}
                          model={agro.relatedObject}
                        />
                      </div>
                    )}
                  />
                </td>
              )}
              {showStatus && <td>{authorizationGroup.humanNameOfStatus()} </td>}
            </tr>
          )
        })}
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
  selection: PropTypes.instanceOf(Map),
  isAllSelected: PropTypes.func,
  toggleAll: PropTypes.func,
  isSelected: PropTypes.func,
  toggleSelection: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupTable)
