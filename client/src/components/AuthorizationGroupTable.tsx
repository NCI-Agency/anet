import Checkbox from "components/Checkbox"
import LinkTo from "components/LinkTo"
import { mapPageDispatchersToProps } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import { AuthorizationGroup } from "models"
import pluralize from "pluralize"
import React from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"
import utils from "utils"

interface TruncatedListProps {
  elementType: string
  elements?: any[]
  maxLines?: number
  renderElement: (...args: unknown[]) => unknown
}

const TruncatedList = ({
  elementType,
  elements,
  maxLines = 0,
  renderElement
}: TruncatedListProps) => {
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

interface AuthorizationGroupTableProps {
  id?: string
  // list of authorizationGroups:
  authorizationGroups: any[]
  // optional columns
  showMembers?: boolean
  showStatus?: boolean
  // fill these when pagination wanted:
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
  allowSelection?: boolean
  // if allowSelection is true:
  selection?: Map
  isAllSelected?: (...args: unknown[]) => unknown
  toggleAll?: (...args: unknown[]) => unknown
  isSelected?: (...args: unknown[]) => unknown
  toggleSelection?: (...args: unknown[]) => unknown
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
}: AuthorizationGroupTableProps) => {
  if (_get(authorizationGroups, "length", 0) === 0) {
    return <em>No communities found</em>
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
          <th>{Settings.fields.authorizationGroup.distributionList?.label}</th>
          <th>
            {Settings.fields.authorizationGroup.forSensitiveInformation?.label}
          </th>
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
        {ags.map(ag => {
          const agEmailAddresses = ag.authorizationGroupRelatedObjects
            .flatMap(agro =>
              agro.relatedObject?.emailAddresses?.map(ea => ({
                key: agro.relatedObjectUuid,
                ...ea
              }))
            )
            .filter(Boolean)
          return (
            <tr key={ag.uuid}>
              {allowSelection && (
                <>
                  <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                    {!_isEmpty(agEmailAddresses) && (
                      <Checkbox
                        checked={isSelected(ag.uuid)}
                        onChange={() =>
                          toggleSelection(ag.uuid, agEmailAddresses)
                        }
                      />
                    )}
                  </td>
                  <td>
                    {(_isEmpty(agEmailAddresses) && (
                      <em>No email addresses available</em>
                    )) || (
                      <TruncatedList
                        elementType="email address"
                        elements={agEmailAddresses}
                        renderElement={ea => (
                          <div key={ea.key}>
                            {utils.createMailtoLink(ea.address)}
                          </div>
                        )}
                      />
                    )}
                  </td>
                </>
              )}
              <td>
                <LinkTo modelType="AuthorizationGroup" model={ag} />
              </td>
              <td>{ag.description}</td>
              <td>{utils.formatBoolean(ag.distributionList)}</td>
              <td>{utils.formatBoolean(ag.forSensitiveInformation)}</td>
              {showMembers && (
                <td>
                  <TruncatedList
                    elementType="member"
                    elements={ag.authorizationGroupRelatedObjects}
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
              {showStatus && <td>{ag.humanNameOfStatus()} </td>}
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

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupTable)
