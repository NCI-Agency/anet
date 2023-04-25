import LinkTo from "components/LinkTo"
import Model from "components/Model"
import React from "react"
import { Table } from "react-bootstrap"

const attachmentRelatedObjectsTable = ({ relatedObjects }) => {
  return (
    <div id="related_objects">
      {relatedObjects?.length > 0 ? (
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
      ) : (
        <em>No linked objects</em>
      )}
    </div>
  )
}

attachmentRelatedObjectsTable.propTypes = {
  relatedObjects: Model.attachmentRelatedObjectsPropType.isRequired
}

export default attachmentRelatedObjectsTable
