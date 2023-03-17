import AppContext from "components/AppContext"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import {
  CustomFieldsContainer,
  ReadonlyCustomFields
} from "components/CustomFields"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
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
    _isEmpty(entityInstantAssessmentConfig?.questions) &&
    _isEmpty(entityInstantAssessmentConfig?.questionSets)
  ) {
    return null
  }

  return (
    <tr>
      <td>
        {!_isEmpty(entityInstantAssessmentConfig?.questions) &&
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
        {!_isEmpty(entityInstantAssessmentConfig?.questionSets) && (
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

  function hasFilteredAssessments(ac, e) {
    const filteredAssessment = Model.filterAssessmentConfig(
      ac,
      e,
      relatedObject
    )
    return (
      !_isEmpty(filteredAssessment?.questions) ||
      !_isEmpty(filteredAssessment?.questionSets)
    )
  }
  // Sort entities to display the ones without any assessment at the beginning,
  // then the ones with assessments. Keep the original sort order within each section.
  function sortEntries(e1, e2) {
    const e1hasAssessments = e1
      .getInstantAssessments()
      .some(([, ac]) => hasFilteredAssessments(ac, e1))
    const e2hasAssessments = e2
      .getInstantAssessments()
      .some(([, ac]) => hasFilteredAssessments(ac, e2))
    return Number(e1hasAssessments) - Number(e2hasAssessments)
  }
  function getEntitiesWithAssessments(entity) {
    return entity
      .getInstantAssessments()
      .some(([, ac]) => hasFilteredAssessments(ac, entity))
  }
  const filteredEntities = showEntitiesWithoutAssessments
    ? entities.sort(sortEntries)
    : entities.filter(getEntitiesWithAssessments)
  return (
    <Table>
      <tbody>
        {filteredEntities.map(entity => {
          const entityInstantAssessments = entity.getInstantAssessments()
          const modelType = entityType.resourceName

          return (
            <React.Fragment key={`assessment-${values.uuid}-${entity.uuid}`}>
              <tr>
                <td>
                  {modelType === Task.resourceName ? (
                    <BreadcrumbTrail
                      modelType={modelType}
                      leaf={entity}
                      ascendantObjects={entity.ascendantTasks}
                      parentField="parentTask"
                    />
                  ) : (
                    <LinkTo modelType={modelType} model={entity} />
                  )}
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
