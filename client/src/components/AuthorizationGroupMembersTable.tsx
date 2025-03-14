import EmailAddressList from "components/EmailAddressList"
import LinkTo from "components/LinkTo"
import pluralize from "pluralize"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

interface AuthorizationGroupMembersTableProps {
  authorizationGroup: any
}

export const AuthorizationGroupMembersTable = ({
  authorizationGroup
}: AuthorizationGroupMembersTableProps) => {
  const label =
    Settings.fields.authorizationGroup.authorizationGroupRelatedObjects?.label
  return (
    <>
      {authorizationGroup?.authorizationGroupRelatedObjects?.length > 0 ? (
        <Table striped hover responsive className="related_objects_table">
          <thead>
            <tr>
              <th>{pluralize.singular(label)}</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {authorizationGroup.authorizationGroupRelatedObjects.map(agro => (
              <tr key={agro.relatedObjectUuid}>
                <td>
                  <LinkTo
                    modelType={agro.relatedObjectType}
                    model={{
                      uuid: agro.relatedObjectUuid,
                      ...agro.relatedObject
                    }}
                  />
                </td>
                <td>
                  <EmailAddressList
                    key={agro.relatedObjectUuid}
                    label="Email addresses"
                    emailAddresses={agro.relatedObject?.emailAddresses}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <em>No {label}</em>
      )}
    </>
  )
}

export default AuthorizationGroupMembersTable
