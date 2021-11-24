import {
  CustomFieldsContainer,
  ReadonlyCustomFields
} from "components/CustomFields"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import QuestionSet from "./QuestionSet"

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
    <Table>
      <tbody>
        {entities.map(entity => {
          const entityInstantAssessmentConfig = Model.filterAssessmentConfig(
            entity.getInstantAssessmentConfig(),
            entity,
            relatedObject
          )
          if (
            _isEmpty(entityInstantAssessmentConfig.questions) &&
            _isEmpty(entityInstantAssessmentConfig.questionSets)
          ) {
            return null
          }
          return (
            <React.Fragment key={`assessment-${values.uuid}-${entity.uuid}`}>
              <tr>
                <td>
                  <LinkTo modelType={entityType.resourceName} model={entity} />
                </td>
              </tr>
              <tr>
                <td>
                  {!_isEmpty(entityInstantAssessmentConfig.questions) &&
                    (readonly ? (
                      <ReadonlyCustomFields
                        parentFieldName={`${parentFieldName}.${entity.uuid}`}
                        fieldsConfig={entityInstantAssessmentConfig.questions}
                        values={values}
                      />
                    ) : (
                      <CustomFieldsContainer
                        parentFieldName={`${parentFieldName}.${entity.uuid}`}
                        fieldsConfig={entityInstantAssessmentConfig.questions}
                        formikProps={formikProps}
                      />
                    ))}
                  {!_isEmpty(entityInstantAssessmentConfig.questionSets) && (
                    <QuestionSet
                      entity={entity}
                      relatedObject={relatedObject}
                      questionSets={entityInstantAssessmentConfig.questionSets}
                      parentFieldName={`${parentFieldName}.${entity.uuid}.questionSets`}
                      formikProps={formikProps}
                      readonly={readonly}
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
