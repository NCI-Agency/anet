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
  const { hasReadAccess, hasWriteAccess } = useMemo(() => {
    const hasReadAccess =
      canRead ||
      entity.isAuthorizedForAssessment(currentUser, assessmentKey, true)
    const hasWriteAccess =
      canWrite ||
      entity.isAuthorizedForAssessment(currentUser, assessmentKey, false)
    return { hasReadAccess, hasWriteAccess }
  }, [assessmentKey, canRead, canWrite, currentUser, entity])
  const entityInstantAssessmentConfig = useMemo(
    () => Model.filterAssessmentConfig(assessmentConfig, entity, relatedObject),
    [assessmentConfig, entity, relatedObject]
  )
  if (!hasReadAccess) {
    return null
  }

  const readOnlyAccess = readonly || !hasWriteAccess
  const { values } = formikProps
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
  readonly,
  showEntitiesWithoutAssessments
}) => {
  const { values } = formikProps
  function sortEntries(e1, e2) {
    const e1entityInstantAssessments = e1.getInstantAssessments()
    return e1entityInstantAssessments.some(([ak, ac]) => {
      const filteredAssessment = Model.filterAssessmentConfig(
        ac,
        e1,
        relatedObject
      )
      return (
        !_isEmpty(filteredAssessment.questions) ||
        !_isEmpty(filteredAssessment.questionSets)
      )
    })
      ? 1
      : -1
  }
  function getEntitiesWithAssessments(entity) {
    const entityInstantAssessments = entity.getInstantAssessments()
    return entityInstantAssessments.some(([ak, ac]) => {
      const filteredAssessment = Model.filterAssessmentConfig(
        ac,
        entity,
        relatedObject
      )
      return (
        !_isEmpty(filteredAssessment.questions) ||
        !_isEmpty(filteredAssessment.questionSets)
      )
    })
  }
  // Sort entities to display the ones without any assessment at the beginning
  const filteredEntities = showEntitiesWithoutAssessments
    ? entities.sort(sortEntries)
    : entities.filter(getEntitiesWithAssessments)
  return (
    <Table>
      <tbody>
        {filteredEntities.map(entity => {
          const entityInstantAssessments = entity.getInstantAssessments()

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
  readonly: PropTypes.bool,
  showEntitiesWithoutAssessments: PropTypes.bool
}
InstantAssessmentsContainerField.defaultProps = {
  entities: [],
  canRead: false,
  canWrite: false,
  readonly: false
}
export default InstantAssessmentsContainerField
