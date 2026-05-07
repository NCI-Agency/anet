import { RelatedObjectDisplay } from "components/RelatedObjectDisplay"
import React from "react"
import { Table } from "react-bootstrap"

interface AttachmentRelatedObjectsTableProps {
  relatedObjects: Model.attachmentRelatedObjectsPropType
}

const AttachmentRelatedObjectsTable = ({
  relatedObjects
}: AttachmentRelatedObjectsTableProps) => {
  return (
    <div className="related_objects">
      {!relatedObjects?.length ? (
        <em>No linked objects</em>
      ) : (
        <Table striped hover responsive className="related_objects_table">
          <tbody>
            {relatedObjects.map(attachRelObj => (
              <tr key={attachRelObj.relatedObjectUuid}>
                <td>
                  <RelatedObjectDisplay
                    relatedObjectType={attachRelObj.relatedObjectType}
                    relatedObjectUuid={attachRelObj.relatedObjectUuid}
                    relatedObject={attachRelObj.relatedObject}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}

export default AttachmentRelatedObjectsTable
