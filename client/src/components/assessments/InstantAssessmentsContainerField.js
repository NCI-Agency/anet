import {
  CustomFieldsContainer,
  ReadonlyCustomFields
} from "components/CustomFields"
import LinkToPreviewed from "components/LinkToPreviewed"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const InstantAssessmentsContainerField = ({
  entityType,
  entities,
  relatedObject,
  parentFieldName,
  formikProps,
  readonly
}) => {
  const { values } = formikProps
  return (
    <Table condensed responsive>
      <tbody>
        {entities.map(entity => {
          const entityInstantAssessmentConfig = Model.filterAssessmentConfig(
            entity.getInstantAssessmentConfig(),
            entity,
            relatedObject
          )
          if (_isEmpty(entityInstantAssessmentConfig)) {
            return null
          }
          return (
            <React.Fragment key={`assessment-${values.uuid}-${entity.uuid}`}>
              <tr>
                <td>
                  <LinkToPreviewed
                    modelType={entityType.resourceName}
                    model={entity}
                    previewId="inst-assess-entity"
                  />
                </td>
              </tr>
              <tr>
                <td>
                  {readonly ? (
                    <ReadonlyCustomFields
                      parentFieldName={`${parentFieldName}.${entity.uuid}`}
                      fieldsConfig={entityInstantAssessmentConfig}
                      values={values}
                      linkToComp={LinkToPreviewed}
                    />
                  ) : (
                    <CustomFieldsContainer
                      parentFieldName={`${parentFieldName}.${entity.uuid}`}
                      fieldsConfig={entityInstantAssessmentConfig}
                      formikProps={formikProps}
                      linkToComp={LinkToPreviewed}
                    />
                  )}
                </td>
              </tr>
            </React.Fragment>
          )
        })}
      </tbody>
    </Table>
  )
}
InstantAssessmentsContainerField.propTypes = {
  entityType: PropTypes.func.isRequired,
  entities: PropTypes.arrayOf(PropTypes.instanceOf(Model)),
  relatedObject: PropTypes.object,
  parentFieldName: PropTypes.string.isRequired,
  formikProps: PropTypes.shape({
    setFieldTouched: PropTypes.func,
    setFieldValue: PropTypes.func,
    values: PropTypes.object.isRequired,
    validateForm: PropTypes.func
  }),
  readonly: PropTypes.bool
}
InstantAssessmentsContainerField.defaultProps = {
  entities: [],
  readonly: false
}
export default InstantAssessmentsContainerField
