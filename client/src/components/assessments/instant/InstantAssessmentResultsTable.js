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
import { QuestionSetRow, QuestionsRow } from "./InstantAssessmentQuestions"

/*
 * The InstantAssessmentResultsTable component displays the results of instant assessments made
 * on the entity/subentities when working on them in relation to another type of entity (example:
 * assessments made on tasks, while filling  report related to the tasks) or assessments made on
 * the entity/subentity itself.
 */

const EntityInstantAssessmentResults = ({
  assessmentKey,
  idSuffix,
  entity,
  entityType,
  periodsConfig
}) => {
  if (!entity) {
    return null
  }
  const instantAssessmentConfig =
    entity.getInstantAssessmentConfig(assessmentKey)
  const modelType = entityType.resourceName
  const { periods } = periodsConfig
  const dataPerPeriod = []
  periods.forEach(period =>
    dataPerPeriod.push(
      entity.getInstantAssessmentResults(period, assessmentKey)
    )
  )
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
      {Object.entries(instantAssessmentConfig?.questions || {}).map(
        ([key, config], index) => (
          <QuestionsRow
            key={key}
            idSuffix={`${key}-${idSuffix}`}
            questionKey={key}
            questionConfig={config}
            periods={periods}
            periodsData={dataPerPeriod}
            isFirstRow={index === 0}
          />
        )
      )}
      {Object.entries(instantAssessmentConfig?.questionSets || {}).map(
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
    </>
  )
}
EntityInstantAssessmentResults.propTypes = {
  assessmentKey: PropTypes.string.isRequired,
  idSuffix: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  periodsConfig: AssessmentPeriodsConfigPropType.isRequired
}

const InstantAssessmentResultsTable = ({
  assessmentKey,
  entity,
  entityType,
  subEntities,
  style,
  periodsDetails
}) => {
  const [offset, setOffset] = useState(0)
  if (!entity) {
    return null
  }
  const { recurrence, numberOfPeriods } = periodsDetails
  const periodsConfig = getPeriodsConfig(recurrence, numberOfPeriods, offset)
  if (_isEmpty(periodsConfig?.periods)) {
    return null
  }
  const entityInstantAssessmentConfig =
    entity.getInstantAssessmentConfig(assessmentKey)
  const subEntitiesInstantAssessmentConfig = subEntities
    ?.map(s => s.getInstantAssessmentConfig(assessmentKey))
    .filter(mc => !_isEmpty(mc))
  if (
    _isEmpty(entityInstantAssessmentConfig) &&
    _isEmpty(subEntitiesInstantAssessmentConfig)
  ) {
    return null
  }
  return (
    <>
      <div style={{ ...style }}>
        <Fieldset
          title={
            entityInstantAssessmentConfig?.label ||
            `Instant assessment results for ${assessmentKey}`
          }
          id={`entity-assessments-results-${assessmentKey}-${recurrence}`}
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
                  <EntityInstantAssessmentResults
                    key={`subassessment-${assessmentKey}-${subEntity.uuid}`}
                    assessmentKey={assessmentKey}
                    idSuffix={`subassessment-${assessmentKey}-${subEntity.uuid}`}
                    entity={subEntity}
                    entityType={entityType}
                    periodsConfig={periodsConfig}
                  />
                ))}
              </>
              <EntityInstantAssessmentResults
                assessmentKey={assessmentKey}
                idSuffix={`assessment-${assessmentKey}-${entity.uuid}`}
                entity={entity}
                entityType={entityType}
                periodsConfig={periodsConfig}
              />
            </tbody>
          </Table>
        </Fieldset>
      </div>
    </>
  )
}
InstantAssessmentResultsTable.propTypes = {
  style: PropTypes.object,
  assessmentKey: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  periodsDetails: PeriodsDetailsPropType.isRequired
}

export default InstantAssessmentResultsTable
