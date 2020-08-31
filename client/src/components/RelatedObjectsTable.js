import LinkTo from "components/LinkTo"
import Model from "components/Model"
import MultiTypeAdvancedSelectComponent from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import RemoveButton from "components/RemoveButton"
import _get from "lodash/get"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import utils from "utils"

const RelatedObjectsTable = ({
  currentObject,
  relatedObjects,
  onSelect,
  showDelete,
  onDelete
}) => {
  const relatedObjectsExist = _get(relatedObjects, "length", 0) > 0

  return (
    <div id="related_objects">
      <MultiTypeAdvancedSelectComponent
        onConfirm={(value, objectType) => {
          onSelect(value, objectType)
        }}
      />
      {relatedObjectsExist ? (
        <Table
          striped
          condensed
          hover
          responsive
          className="related_objects_table"
        >
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
                          altText="Unlink object"
                          onClick={() => onDelete(nro)}
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
  onSelect: PropTypes.func.isRequired,
  showDelete: PropTypes.bool,
  onDelete: utils.fnRequiredWhen.bind(null, "showDelete")
}

RelatedObjectsTable.defaultProps = {
  showDelete: false
}

export default RelatedObjectsTable
