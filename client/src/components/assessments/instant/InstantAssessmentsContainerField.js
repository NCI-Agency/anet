import AppContext from "components/AppContext"
import {
  CustomFieldsContainer,
  ReadonlyCustomFields
} from "components/CustomFields"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useContext, useMemo } from "react"
import { Table } from "react-bootstrap"
import QuestionSet from "../QuestionSet"

const InstantAssessmentRow = ({
  assessmentKey,
  assessmentConfig,
  parentFieldName,
  entity,
  relatedObject,
  formikProps,
  canRead,
  canWrite,
  readonly
}) => {
  const { currentUser } = useContext(AppContext)
  const { hasWriteAccess, hasAccess } = useMemo(() => {
    const hasReadAccess =
      canRead ||
      entity.isAuthorizedForAssessment(currentUser, assessmentKey, true)
    const hasWriteAccess =
      canWrite ||
      entity.isAuthorizedForAssessment(currentUser, assessmentKey, false)
    const hasAccess = hasReadAccess || hasWriteAccess
    return { hasReadAccess, hasWriteAccess, hasAccess }
  }, [assessmentKey, canRead, canWrite, currentUser, entity])
  if (!hasAccess) {
    return null
  }

  const readOnlyAccess = readonly || !hasWriteAccess
  const { values } = formikProps
  const entityInstantAssessmentConfig = Model.filterAssessmentConfig(
    assessmentConfig,
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
    <tr>
      <td>
        {!_isEmpty(entityInstantAssessmentConfig.questions) &&
          (readOnlyAccess ? (
            <ReadonlyCustomFields
              parentFieldName={parentFieldName}
              fieldsConfig={entityInstantAssessmentConfig.questions}
              values={values}
            />
          ) : (
            <CustomFieldsContainer
              parentFieldName={parentFieldName}
              fieldsConfig={entityInstantAssessmentConfig.questions}
              formikProps={formikProps}
            />
          ))}
        {!_isEmpty(entityInstantAssessmentConfig.questionSets) && (
          <QuestionSet
            entity={entity}
            relatedObject={relatedObject}
            questionSets={entityInstantAssessmentConfig.questionSets}
            parentFieldName={`${parentFieldName}.questionSets`}
            formikProps={formikProps}
            readonly={readOnlyAccess}
          />
        )}
      </td>
    </tr>
  )
}
InstantAssessmentRow.propTypes = {
  assessmentKey: PropTypes.string.isRequired,
  assessmentConfig: PropTypes.object.isRequired,
  entity: PropTypes.object.isRequired,
  relatedObject: PropTypes.object,
  parentFieldName: PropTypes.string.isRequired,
  formikProps: PropTypes.shape({
    setFieldTouched: PropTypes.func,
    setFieldValue: PropTypes.func,
    values: PropTypes.object.isRequired,
    validateForm: PropTypes.func
  }),
  canRead: PropTypes.bool,
  canWrite: PropTypes.bool,
  readonly: PropTypes.bool
}

const InstantAssessmentsContainerField = ({
  entityType,
  entities,
  relatedObject,
  parentFieldName,
  formikProps,
  canRead,
  canWrite,
  readonly
}) => {
  const { values } = formikProps
  return (
    <Table>
      <tbody>
        {entities.map(entity => {
          const entityInstantAssessments = entity.getInstantAssessments()
          let hasAssessments = false
          entityInstantAssessments.forEach(([ak, ac]) => {
            const filteredAssessment = Model.filterAssessmentConfig(
              ac,
              entity,
              relatedObject
            )
            if (
              !_isEmpty(filteredAssessment.questions) ||
              !_isEmpty(filteredAssessment.questionSets)
            ) {
              hasAssessments = true
            }
          })
          if (!hasAssessments) {
            return null
          }

          return (
            <React.Fragment key={`assessment-${values.uuid}-${entity.uuid}`}>
              <tr>
                <td>
                  <LinkTo modelType={entityType.resourceName} model={entity} />
                </td>
              </tr>
              {entityInstantAssessments.map(([ak, ac]) => (
                <InstantAssessmentRow
                  key={ak}
                  assessmentKey={ak}
                  assessmentConfig={ac}
                  parentFieldName={`${parentFieldName}.${entity.uuid}.${ak}`}
                  entity={entity}
                  relatedObject={relatedObject}
                  formikProps={formikProps}
                  canRead={canRead}
                  canWrite={canWrite}
                  readonly={readonly}
                />
              ))}
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
  canRead: PropTypes.bool,
  canWrite: PropTypes.bool,
  readonly: PropTypes.bool
}
InstantAssessmentsContainerField.defaultProps = {
  entities: [],
  canRead: false,
  canWrite: false,
  readonly: false
}
export default InstantAssessmentsContainerField
