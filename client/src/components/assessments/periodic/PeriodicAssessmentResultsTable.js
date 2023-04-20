import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import PeriodsNavigation from "components/PeriodsNavigation"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import {
  AssessmentPeriodsConfigPropType,
  getPeriodsConfig,
  PeriodsDetailsPropType,
  PeriodsTableHeader
} from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { QuestionSetRow, QuestionsRow } from "./PeriodicAssessmentQuestions"
import { PeriodicAssessmentsRows } from "./PeriodicAssessmentResults"
import "./PeriodicAssessmentResultsTable.css"

/* The PeriodicAssessmentResultsTable component displays the results of two types of
 * assessments made on a given entity and subentities:
 * - instant assessments => made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks) or
 *   assessments made on the entity/subentity itself;
 *   the configuration of these assessments can be retrieved using
 *   entity.getInstantAssessments()
 * - periodic assessments => made on the entity/subentities periodically,
 *   as a measurement of the given period of time;
 *   the config and yupSchema for these assessments is to be found in
 *   entity.getPeriodicAssessmentDetails(assessmentKey)
 */

const EntityPeriodicAssessmentResults = ({
  assessmentKey,
  idSuffix,
  entity,
  entityType,
  periodsConfig,
  canAddAssessment,
  onUpdateAssessment
}) => {
  if (!entity) {
    return null
  }
  const instantAssessments = entity.getInstantAssessments()
  const modelType = entityType.resourceName
  const { periods } = periodsConfig
  return (
    <>
      <tr>
        <td colSpan={periods.length} className="entity-title-row">
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
      {instantAssessments.map(([ak, ac]) => {
        const dataPerPeriod = []
        periods.forEach(period =>
          dataPerPeriod.push(entity.getInstantAssessmentResults(period, ak))
        )
        return (
          <React.Fragment key={ak}>
            {Object.entries(ac?.questions || {}).map(([key, config], index) => (
              <QuestionsRow
                key={key}
                idSuffix={`${key}-${idSuffix}`}
                questionKey={key}
                questionConfig={config}
                periods={periods}
                periodsData={dataPerPeriod}
                isFirstRow={index === 0}
              />
            ))}
            {Object.entries(ac?.questionSets || {}).map(
              ([questionSet, config]) => (
                <QuestionSetRow
                  idSuffix={`${idSuffix}-${questionSet}`}
                  key={questionSet}
                  questionSetConfig={config}
                  questionSetKey={questionSet}
                  periods={periods}
                  periodsData={dataPerPeriod}
                />
              )
            )}
          </React.Fragment>
        )
      })}
      <PeriodicAssessmentsRows
        assessmentKey={assessmentKey}
        entity={entity}
        entityType={entityType}
        periodsConfig={periodsConfig}
        canAddAssessment={canAddAssessment}
        onUpdateAssessment={onUpdateAssessment}
      />
    </>
  )
}
EntityPeriodicAssessmentResults.propTypes = {
  assessmentKey: PropTypes.string.isRequired,
  idSuffix: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  periodsConfig: AssessmentPeriodsConfigPropType.isRequired,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

const PeriodicAssessmentResultsTable = ({
  assessmentKey,
  entity,
  entityType,
  subEntities,
  style,
  periodsDetails,
  canAddAssessment,
  onUpdateAssessment
}) => {
  const [offset, setOffset] = useState(0)
  if (!entity) {
    return null
  }
  const { recurrence, numberOfPeriods } = periodsDetails
  const periodsConfig = getPeriodsConfig(
    recurrence,
    numberOfPeriods,
    offset,
    true
  )
  if (_isEmpty(periodsConfig?.periods)) {
    return null
  }
  const entityInstantAssessmentConfig = entity.getInstantAssessments()
  const subEntitiesInstantAssessmentConfig = subEntities
    ?.map(s => s.getInstantAssessments())
    .filter(mc => !_isEmpty(mc))
  const { assessmentConfig } = entity.getAssessmentDetails(assessmentKey)
  if (
    _isEmpty(entityInstantAssessmentConfig) &&
    _isEmpty(subEntitiesInstantAssessmentConfig) &&
    _isEmpty(assessmentConfig)
  ) {
    return null
  }
  return (
    <>
      <div style={{ ...style }}>
        <Fieldset
          title={`Assessment results - ${
            assessmentConfig?.label || recurrence
          }`}
          id={`entity-assessments-results-${recurrence}`}
        >
          <PeriodsNavigation offset={offset} onChange={setOffset} />
          <Table
            borderless
            responsive
            className="assessments-table"
            style={{ tableLayout: "fixed" }}
          >
            <PeriodsTableHeader periodsConfig={periodsConfig} />
            <tbody>
              <>
                {subEntities?.map(subEntity => (
                  <EntityPeriodicAssessmentResults
                    key={`subassessment-${subEntity.uuid}`}
                    assessmentKey={assessmentKey}
                    idSuffix={`subassessment-${subEntity.uuid}`}
                    entity={subEntity}
                    entityType={entityType}
                    periodsConfig={periodsConfig}
                    canAddAssessment={false}
                    onUpdateAssessment={onUpdateAssessment}
                  />
                ))}
              </>
              <EntityPeriodicAssessmentResults
                assessmentKey={assessmentKey}
                idSuffix={`assessment-${entity.uuid}`}
                entity={entity}
                entityType={entityType}
                periodsConfig={periodsConfig}
                canAddAssessment={canAddAssessment}
                onUpdateAssessment={onUpdateAssessment}
              />
            </tbody>
          </Table>
        </Fieldset>
      </div>
    </>
  )
}
PeriodicAssessmentResultsTable.propTypes = {
  style: PropTypes.object,
  assessmentKey: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  periodsDetails: PeriodsDetailsPropType.isRequired,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

export default PeriodicAssessmentResultsTable
