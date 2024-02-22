import LinkTo from "components/LinkTo"
import Model from "components/Model"
import React from "react"
import { Table } from "react-bootstrap"

const AttachmentRelatedObjectsTable = ({ relatedObjects }) => {
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
                  <LinkTo
                    modelType={attachRelObj.relatedObjectType}
                    model={{
                      uuid: attachRelObj.relatedObjectUuid,
                      ...attachRelObj.relatedObject
                    }}
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

AttachmentRelatedObjectsTable.propTypes = {
  relatedObjects: Model.attachmentRelatedObjectsPropType.isRequired
}

export default AttachmentRelatedObjectsTable
