import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import LinkTo from "components/LinkTo"
import { MODEL_TO_OBJECT_TYPE } from "components/Model"
import RemoveButton from "components/RemoveButton"
import pluralize from "pluralize"
import React from "react"
import { Table } from "react-bootstrap"

interface RelatedObjectsTableProps {
  title?: string
  currentObject?: any
  relatedObjects: any
  setRelatedObjects?: (...args: unknown[]) => unknown
  showDelete?: boolean
}

export const RelatedObjectsTable = ({
  title = "Linked Object",
  currentObject,
  relatedObjects,
  setRelatedObjects = () => {},
  showDelete = false
}: RelatedObjectsTableProps) => {
  return (
    <>
      {relatedObjects.length > 0 ? (
        <Table striped hover responsive className="related_objects_table">
          <thead>
            <tr>
              <th>{title}</th>
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
        <em>No {pluralize(title)}</em>
      )}
    </>
  )
}

interface RelatedObjectsTableInputProps {
  title?: string
  currentObject?: any
  relatedObjects: any
  objectType?: string
  entityTypes?: string[]
  entityFilters?: object[]
  setRelatedObjects: (...args: unknown[]) => unknown
  showDelete?: boolean
}

export const RelatedObjectsTableInput = ({
  title,
  currentObject,
  relatedObjects,
  objectType,
  entityTypes,
  entityFilters,
  setRelatedObjects,
  showDelete = false
}: RelatedObjectsTableInputProps) => {
  const fieldValue = relatedObjects.map(nro => ({
    uuid: nro.relatedObjectUuid
  }))

  return (
    <div className="related_objects">
      <MultiTypeAdvancedSelectComponent
        value={fieldValue}
        objectType={objectType}
        entityTypes={entityTypes}
        filters={entityFilters}
        isMultiSelect
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
      <RelatedObjectsTable
        title={title}
        currentObject={currentObject}
        relatedObjects={relatedObjects}
        setRelatedObjects={setRelatedObjects}
        showDelete={showDelete}
      />
    </div>
  )
}
