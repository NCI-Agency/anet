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
import utils from "utils"
import { PeriodicAssessmentsRows } from "./PeriodicAssessmentResults"

/*
 * The PeriodicAssessmentResultsTable component displays the results of periodic assessments made
 * on the entity periodically, as a measurement of the given period of time.
 */

const EntityPeriodicAssessmentResults = ({
  assessmentKey,
  entity,
  entityType,
  periodsConfig,
  canAddAssessment,
  onUpdateAssessment
}) => {
  if (!entity) {
    return null
  }
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
  const entityPeriodicAssessmentConfig =
    entity.getInstantAssessmentConfig(assessmentKey)
  const { recurrence, numberOfPeriods } = periodsDetails
  const periodsConfig = getPeriodsConfig(
    recurrence,
    numberOfPeriods,
    offset,
    true,
    entityPeriodicAssessmentConfig?.allowFutureAssessments
  )
  if (_isEmpty(periodsConfig?.periods)) {
    return null
  }
  const subEntitiesPeriodicAssessmentConfig = subEntities
    ?.map(s => s.getInstantAssessmentConfig(assessmentKey))
    .filter(mc => !_isEmpty(mc))
  if (
    _isEmpty(entityPeriodicAssessmentConfig) &&
    _isEmpty(subEntitiesPeriodicAssessmentConfig)
  ) {
    return null
  }
  return (
    <>
      <div style={{ ...style }}>
        <Fieldset
          title={
            entityPeriodicAssessmentConfig?.label ||
            `${utils.sentenceCase(
              recurrence
            )} assessment results for ${assessmentKey}`
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
                  <EntityPeriodicAssessmentResults
                    key={`subassessment-${assessmentKey}-${subEntity.uuid}`}
                    assessmentKey={assessmentKey}
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
