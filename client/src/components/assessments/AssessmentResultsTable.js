import AggregationWidgetContainer, {
  getAggregationWidget
} from "components/aggregations/AggregationWidgetContainer"
import AppContext from "components/AppContext"
import AssessmentModal from "components/assessments/AssessmentModal"
import PeriodicAssessment from "components/assessments/PeriodicAssessment"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { NOTE_TYPE } from "components/Model"
import PeriodsNavigation from "components/PeriodsNavigation"
import { Person } from "models"
import _isEmpty from "lodash/isEmpty"
import _uniqueId from "lodash/uniqueId"
import {
  AssessmentPeriodsConfigPropType,
  getPeriodsConfig,
  PeriodsDetailsPropType,
  PeriodsPropType,
  PeriodsTableHeader,
  periodToString
} from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import "components/assessments/AssessmentResultsTable.css"

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

const InstantAssessmentRow = ({
  questionKey,
  questionConfig,
  entity,
  periods,
  periodsData,
  isFirstRow
}) => {
  const aggregationWidget = getAggregationWidget(questionConfig)
  if (_isEmpty(periods) || !aggregationWidget) {
    return null
  }
  return (
    <tr>
      {periods.map((period, index) => (
        <td key={index}>
          {_isEmpty(periodsData[index]) ? (
            isFirstRow ? (
              <em>No assessments</em>
            ) : null
          ) : (
            <AggregationWidgetContainer
              key={`assessment-${questionKey}`}
              fieldConfig={questionConfig}
              fieldName={questionKey}
              data={periodsData[index]}
              widget={aggregationWidget}
              widgetId={`${questionKey}-${_uniqueId("assessment")}`}
            />
          )}
        </td>
      ))}
    </tr>
  )
}
InstantAssessmentRow.propTypes = {
  entity: PropTypes.object.isRequired,
  periods: PeriodsPropType.isRequired,
  periodsData: PropTypes.arrayOf(PropTypes.array).isRequired,
  questionKey: PropTypes.string.isRequired,
  questionConfig: PropTypes.object.isRequired,
  isFirstRow: PropTypes.bool
}

const BasePeriodicAssessmentRows = ({
  entity,
  entityType,
  periodsConfig,
  canAddAssessment,
  onUpdateAssessment,
  currentUser
}) => {
  const [showAssessmentModalKey, setShowAssessmentModalKey] = useState(null)
  const { recurrence, periods } = periodsConfig
  if (_isEmpty(periods)) {
    return null
  }

  const {
    assessmentConfig,
    assessmentYupSchema
  } = entity.getPeriodicAssessmentDetails(recurrence)
  if (!assessmentConfig) {
    return null
  }

  const periodsAssessments = []
  const periodsAllowNewAssessment = []
  periods.forEach(period => {
    const periodAssessments = entity.getPeriodAssessments(
      recurrence,
      period,
      currentUser
    )
    const myPeriodAssessments = periodAssessments.filter(
      ({ note, assessment }) => Person.isEqual(currentUser, note.author)
    )
    periodsAssessments.push(periodAssessments)
    // Only allow adding new assessments for a period if the user has the rights
    // for it, if the period is configured to allow adding new assessments and
    // if the current user didn't already made an assessment for the period
    periodsAllowNewAssessment.push(
      canAddAssessment &&
        period.allowNewAssessments &&
        _isEmpty(myPeriodAssessments)
    )
  })
  const hasPeriodicAssessmentsRow = !_isEmpty(
    periodsAssessments.filter(x => !_isEmpty(x))
  )
  const hasAddAssessmentRow = !_isEmpty(
    periodsAllowNewAssessment.filter(x => x)
  )
  return (
    <>
      {hasPeriodicAssessmentsRow && (
        <tr>
          {periodsAssessments.map((periodAssessments, index) => {
            return (
              <td key={index}>
                {periodAssessments &&
                  periodAssessments.map(({ note, assessment }, i) => (
                    <div key={note.uuid}>
                      <PeriodicAssessment
                        note={note}
                        assessment={assessment}
                        assessmentYupSchema={assessmentYupSchema}
                        assessmentConfig={assessmentConfig}
                        entity={entity}
                        period={periods[index]}
                        recurrence={recurrence}
                        onUpdateAssessment={onUpdateAssessment}
                      />
                    </div>
                  ))}
              </td>
            )
          })}
        </tr>
      )}
      {hasAddAssessmentRow && (
        <tr>
          {periods.map((period, index) => {
            const periodDisplay = periodToString(period)
            const addAssessmentLabel = `Make a new ${entity?.toString()} assessment for ${periodDisplay}`
            const modalKey = `${entity.uuid}-${periodDisplay}`
            return (
              <td key={index}>
                {periodsAllowNewAssessment[index] && (
                  <>
                    <Button
                      bsStyle="primary"
                      onClick={() => setShowAssessmentModalKey(modalKey)}
                    >
                      {addAssessmentLabel}
                    </Button>
                    <AssessmentModal
                      showModal={showAssessmentModalKey === modalKey}
                      note={{
                        type: NOTE_TYPE.ASSESSMENT,
                        noteRelatedObjects: [
                          {
                            relatedObjectType: entityType.relatedObjectType,
                            relatedObjectUuid: entity.uuid
                          }
                        ]
                      }}
                      title={`Assessment for ${entity.toString()} for ${periodDisplay}`}
                      addAssessmentLabel={addAssessmentLabel}
                      assessmentYupSchema={assessmentYupSchema}
                      recurrence={recurrence}
                      assessmentPeriod={period}
                      assessmentConfig={assessmentConfig}
                      onSuccess={() => {
                        setShowAssessmentModalKey(null)
                        onUpdateAssessment()
                      }}
                      onCancel={() => setShowAssessmentModalKey(null)}
                    />
                  </>
                )}
              </td>
            )
          })}
        </tr>
      )}
    </>
  )
}
BasePeriodicAssessmentRows.propTypes = {
  entity: PropTypes.object.isRequired,
  entityType: PropTypes.func.isRequired,
  periodsConfig: AssessmentPeriodsConfigPropType.isRequired,
  canAddAssessment: PropTypes.bool,
  onUpdateAssessment: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(Person)
}

const PeriodicAssessmentRows = props => (
  <AppContext.Consumer>
    {context => (
      <BasePeriodicAssessmentRows
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

const EntityAssessmentResults = ({
  entity,
  entityType,
  style,
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
      {Object.keys(instantAssessmentConfig || {}).map((key, index) => (
        <InstantAssessmentRow
          key={key}
          questionKey={key}
          questionConfig={instantAssessmentConfig[key]}
          periods={periods}
          periodsData={dataPerPeriod}
          entity={entity}
          isFirstRow={index === 0}
        />
      ))}
      <PeriodicAssessmentRows
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
  style: PropTypes.object,
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
  const subentitiesInstantAssessmentConfig = subEntities
    ?.map(s => s.getInstantAssessmentConfig())
    .filter(mc => !_isEmpty(mc))
  const { assessmentConfig } = entity.getPeriodicAssessmentDetails(recurrence)
  const showAssessmentResults =
    !_isEmpty(entityInstantAssessmentConfig) ||
    !_isEmpty(subentitiesInstantAssessmentConfig) ||
    !_isEmpty(assessmentConfig)
  return (
    <>
      {showAssessmentResults && (
        <div style={{ ...style }}>
          <Fieldset
            title={`Assessment results - ${recurrence}`}
            id={`"entity-assessments-results-${recurrence}`}
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
                {!_isEmpty(subEntities) && (
                  <>
                    {subEntities?.map(subEntity => (
                      <EntityAssessmentResults
                        key={`subassessment-${subEntity.uuid}`}
                        entity={subEntity}
                        entityType={entityType}
                        periodsConfig={periodsConfig}
                        canAddAssessment={false}
                      />
                    ))}
                  </>
                )}
                <EntityAssessmentResults
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
