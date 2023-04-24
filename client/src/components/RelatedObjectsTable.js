import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import LinkTo from "components/LinkTo"
import Model, { MODEL_TO_OBJECT_TYPE } from "components/Model"
import RemoveButton from "components/RemoveButton"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const RelatedObjectsTable = ({
  currentObject,
  relatedObjects,
  setRelatedObjects,
  showDelete
}) => {
  const fieldValue = relatedObjects.map(nro => ({
    uuid: nro.relatedObjectUuid
  }))

  return (
    <div id="related_objects">
      <MultiTypeAdvancedSelectComponent
        value={fieldValue}
        isMultiSelect
        keepSearchText
        onConfirm={(value, objectType) => {
          if (value.length > fieldValue.length) {
            // entity was added at the end, set correct value
            const addedEntity = value.pop()
            const newRelatedObject = {
              relatedObjectType: MODEL_TO_OBJECT_TYPE[objectType],
              relatedObjectUuid: addedEntity.uuid,
              relatedObject: addedEntity
            }
            setRelatedObjects([...relatedObjects, newRelatedObject])
          } else {
            // entity was deleted, find which one, but always keep current object
            const valueUuids = value.map(v => v.uuid)
            const newRelatedObjects = relatedObjects.filter(
              ro =>
                (currentObject?.relatedObjectType === ro.relatedObjectType &&
                  currentObject?.relatedObjectUuid === ro.relatedObjectUuid) ||
                valueUuids.includes(ro.relatedObjectUuid)
            )
            setRelatedObjects(newRelatedObjects)
          }
        }}
      />
      {relatedObjects.length > 0 ? (
        <Table striped hover responsive className="related_objects_table">
          <thead>
            <tr>
              <th>Linked Object</th>
              {showDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {relatedObjects.map(nro => (
              <tr key={nro.relatedObjectUuid}>
                <td>
                  <LinkTo
                    modelType={nro.relatedObjectType}
                    model={{
                      uuid: nro.relatedObjectUuid,
                      ...nro.relatedObject
                    }}
                  />
                </td>
                {showDelete &&
                  (currentObject?.relatedObjectType === nro.relatedObjectType &&
                  currentObject?.relatedObjectUuid === nro.relatedObjectUuid ? (
                    <td />
                    ) : (
                      <td id={"relatedObjectsDelete_" + nro.relatedObjectUuid}>
                        <RemoveButton
                          title="Unlink object"
                          onClick={() => {
                            const newRelatedObjects = relatedObjects.filter(
                              item =>
                                item.relatedObjectUuid !== nro.relatedObjectUuid
                            )
                            setRelatedObjects(newRelatedObjects)
                          }}
                        />
                      </td>
                    ))}
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

RelatedObjectsTable.propTypes = {
  currentObject: Model.relatedObjectPropType,
  relatedObjects: Model.noteRelatedObjectsPropType.isRequired,
  setRelatedObjects: PropTypes.func.isRequired,
  showDelete: PropTypes.bool
}

RelatedObjectsTable.defaultProps = {
  showDelete: false
}

export default RelatedObjectsTable
