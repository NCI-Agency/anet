import { RelatedObjectDisplay } from "components/RelatedObjectDisplay"
import React from "react"
import { Table } from "react-bootstrap"

interface EventHostMembersTableProps {
  entity: any
}

const EventHostMembersTable = ({ entity }: EventHostMembersTableProps) => {
  return (
    <>
      {entity?.hostRelatedObjects?.length > 0 ? (
        <Table striped hover responsive className="related_objects_table">
          <tbody>
            {entity.hostRelatedObjects.map(host => (
              <tr key={host.relatedObjectUuid}>
                <td>
                  <RelatedObjectDisplay
                    relatedObjectType={host.relatedObjectType}
                    relatedObjectUuid={host.relatedObjectUuid}
                    relatedObject={host.relatedObject}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <em>No hosts</em>
      )}
    </>
  )
}

export default EventHostMembersTable
