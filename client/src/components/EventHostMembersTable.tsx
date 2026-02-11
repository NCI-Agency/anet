import EmailAddressList from "components/EmailAddressList"
import LinkTo from "components/LinkTo"
import pluralize from "pluralize"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

interface EventHostMembersTableProps {
  event: any
}

export const EventHostMembersTable = ({
  event
}: EventHostMembersTableProps) => {
  const label = Settings.fields.event.eventHostRelatedObjects?.label
  return (
    <>
      {event?.eventHostRelatedObjects?.length > 0 ? (
        <Table striped hover responsive className="related_objects_table">
          <thead>
            <tr>
              <th>{pluralize.singular(label)}</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {event.eventHostRelatedObjects.map(agro => (
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

export default EventHostMembersTable
