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
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import utils from "utils"
import { PeriodicAssessmentsRows } from "./PeriodicAssessmentResults"

interface EntityPeriodicAssessmentResultsProps {
  assessmentKey: string
  entity: any
  entityType: (...args: unknown[]) => unknown
  periodsConfig: AssessmentPeriodsConfigPropType
  onUpdateAssessment: (...args: unknown[]) => unknown
  canAddAssessment?: boolean
}

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
}: EntityPeriodicAssessmentResultsProps) => {
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

interface PeriodicAssessmentResultsTableProps {
  style?: any
  assessmentKey: string
  entity: any
  entityType: (...args: unknown[]) => unknown
  subEntities?: any[]
  periodsDetails: PeriodsDetailsPropType
  onUpdateAssessment: (...args: unknown[]) => unknown
  canAddAssessment?: boolean
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
}: PeriodicAssessmentResultsTableProps) => {
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

export default PeriodicAssessmentResultsTable
