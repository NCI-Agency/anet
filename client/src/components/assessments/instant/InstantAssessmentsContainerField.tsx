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
import React, { useContext, useMemo } from "react"
import { Table } from "react-bootstrap"
import QuestionSet from "../QuestionSet"

interface InstantAssessmentRowProps {
  assessmentKey: string
  assessmentConfig: any
  entity: any
  relatedObject?: any
  parentFieldName: string
  formikProps?: {
    setFieldTouched?: (...args: unknown[]) => unknown
    setFieldValue?: (...args: unknown[]) => unknown
    values: any
    validateForm?: (...args: unknown[]) => unknown
  }
  isCompact?: boolean
  canRead?: boolean
  canWrite?: boolean
  readonly?: boolean
}

const InstantAssessmentRow = ({
  assessmentKey,
  assessmentConfig,
  parentFieldName,
  entity,
  relatedObject,
  formikProps,
  isCompact,
  canRead,
  canWrite,
  readonly
}: InstantAssessmentRowProps) => {
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
              isCompact={isCompact}
              hideIfEmpty={isCompact}
            />
          ) : (
            <CustomFieldsContainer
              parentFieldName={parentFieldName}
              fieldsConfig={entityInstantAssessmentConfig.questions}
              formikProps={formikProps}
              isCompact={isCompact}
              hideIfEmpty={isCompact}
            />
          ))}
        {!_isEmpty(entityInstantAssessmentConfig?.questionSets) && (
          <QuestionSet
            entity={entity}
            relatedObject={relatedObject}
            questionSets={entityInstantAssessmentConfig.questionSets}
            parentFieldName={`${parentFieldName}.questionSets`}
            formikProps={formikProps}
            isCompact={isCompact}
            readonly={readOnlyAccess}
          />
        )}
      </td>
    </tr>
  )
}

interface InstantAssessmentsContainerFieldProps {
  entityType: (...args: unknown[]) => unknown
  entities?: any[]
  relatedObject?: any
  parentFieldName: string
  formikProps?: {
    setFieldTouched?: (...args: unknown[]) => unknown
    setFieldValue?: (...args: unknown[]) => unknown
    values: any
    validateForm?: (...args: unknown[]) => unknown
  }
  isCompact?: boolean
  canRead?: boolean
  canWrite?: boolean
  readonly?: boolean
  showEntitiesWithoutAssessments?: boolean
  id?: string
}

const InstantAssessmentsContainerField = ({
  entityType,
  entities = [],
  relatedObject,
  parentFieldName,
  formikProps,
  isCompact = false,
  canRead = false,
  canWrite = false,
  readonly = false,
  showEntitiesWithoutAssessments,
  id
}: InstantAssessmentsContainerFieldProps) => {
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
    <Table id={id || undefined}>
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
                    <LinkTo
                      modelType={modelType}
                      model={entity}
                      showAvatar={!isCompact}
                    />
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
                  isCompact={isCompact}
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

export default InstantAssessmentsContainerField
