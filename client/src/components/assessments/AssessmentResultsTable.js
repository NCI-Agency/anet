import "components/assessments/AssessmentResultsTable.css"
import { InstantAssessmentsRow } from "components/assessments/InstantAssessmentResults"
import { PeriodicAssessmentsRows } from "components/assessments/PeriodicAssessmentResults"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import PeriodsNavigation from "components/PeriodsNavigation"
import _isEmpty from "lodash/isEmpty"
import {
  AssessmentPeriodsConfigPropType,
  getPeriodsConfig,
  PeriodsDetailsPropType,
  PeriodsTableHeader
} from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"

/* The AssessmentResultsTable component displays the results of two types of
 * assessments made on a given entity and subentities:
 * - instant assessments => made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks) or
 *   assessments made on the entity/subentity itself;
 *   the configuration of these assessments can be retrieved using
 *   entity.getInstantAssessmentConfig()
 * - periodic assessments => made on the entity/subentities periodically,
 *   as a measurement of the given period of time;
 *   the config and yupSchema for these assessments is to be found in
 *   entity.getPeriodicAssessmentDetails(recurrence)
 */

const EntityAssessmentResults = ({
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
  const instantAssessmentConfig = entity.getInstantAssessmentConfig()
  const { periods } = periodsConfig
  const dataPerPeriod = []
  periods.forEach(period =>
    dataPerPeriod.push(entity.getInstantAssessmentResults(period))
  )
  return (
    <>
      <tr>
        <td colSpan={periods.length} className="entity-title-row">
          <LinkTo modelType={entityType.resourceName} model={entity} />
        </td>
      </tr>
      {Object.entries(instantAssessmentConfig || {}).map(
        ([key, config], index) => (
          <InstantAssessmentsRow
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
      <PeriodicAssessmentsRows
        entity={entity}
        entityType={entityType}
        periodsConfig={periodsConfig}
        canAddAssessment={canAddAssessment}
        onUpdateAssessment={onUpdateAssessment}
      />
    </>
  )
}
EntityAssessmentResults.propTypes = {
  idSuffix: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  periodsConfig: AssessmentPeriodsConfigPropType.isRequired,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

const AssessmentResultsTable = ({
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
  const entityInstantAssessmentConfig = entity.getInstantAssessmentConfig()
  const subEntitiesInstantAssessmentConfig = subEntities
    ?.map(s => s.getInstantAssessmentConfig())
    .filter(mc => !_isEmpty(mc))
  const { assessmentConfig } = entity.getPeriodicAssessmentDetails(recurrence)
  const showAssessmentResults =
    !_isEmpty(entityInstantAssessmentConfig) ||
    !_isEmpty(subEntitiesInstantAssessmentConfig) ||
    !_isEmpty(assessmentConfig)
  return (
    <>
      {showAssessmentResults && (
        <div style={{ ...style }}>
          <Fieldset
            title={`Assessment results - ${recurrence}`}
            id={`entity-assessments-results-${recurrence}`}
          >
            <PeriodsNavigation offset={offset} onChange={setOffset} />
            <Table
              condensed
              responsive
              className="assessments-table"
              style={{ tableLayout: "fixed" }}
            >
              <PeriodsTableHeader periodsConfig={periodsConfig} />
              <tbody>
                <>
                  {subEntities?.map(subEntity => (
                    <EntityAssessmentResults
                      key={`subassessment-${subEntity.uuid}`}
                      idSuffix={`subassessment-${subEntity.uuid}`}
                      entity={subEntity}
                      entityType={entityType}
                      periodsConfig={periodsConfig}
                      canAddAssessment={false}
                      onUpdateAssessment={onUpdateAssessment}
                    />
                  ))}
                </>
                <EntityAssessmentResults
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
      )}
    </>
  )
}
AssessmentResultsTable.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  periodsDetails: PeriodsDetailsPropType.isRequired,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsTable
