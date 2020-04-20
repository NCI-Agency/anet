import AggregationWidget from "components/AggregationWidget"
import AddAssessmentModal from "components/assessments/AddAssessmentModal"
import {
  getFieldPropsFromFieldConfig,
  ReadonlyCustomFields
} from "components/CustomFields"
import Fieldset from "components/Fieldset"
import { Formik } from "formik"
import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
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
 *   entity.getPeriodicAssessmentDetails()
 */

const PERIOD_START_SHORT_FORMAT = "D"
const PERIOD_START_MIDDLE_FORMAT = "D MMMM"
const PERIOD_START_LONG_FORMAT = "D MMMM YYYY"
const PERIOD_END_FORMAT = "D MMMM YYYY"

const periodToString = period => {
  if (period.start.isSame(period.end, "day")) {
    return period.end.format(PERIOD_END_FORMAT)
  } else {
    const periodStartFormat =
      period.start.year() !== period.end.year()
        ? PERIOD_START_LONG_FORMAT
        : period.start.month() !== period.end.month()
          ? PERIOD_START_MIDDLE_FORMAT
          : PERIOD_START_SHORT_FORMAT
    return `${period.start.format(periodStartFormat)} - ${period.end.format(
      PERIOD_END_FORMAT
    )}`
  }
}

const periodsPropType = PropTypes.arrayOf(
  PropTypes.shape({
    start: PropTypes.object,
    end: PropTypes.object,
    allowNewAssessments: PropTypes.bool
  })
)
const periodsConfigPropType = PropTypes.shape({
  recurrence: PropTypes.string,
  periods: periodsPropType
})

const AssessmentsTableHeader = ({ periodsConfig }) => (
  <thead>
    <tr key="periods">
      <>
        {periodsConfig.periods.map(period => (
          <th key={period.start}>{periodToString(period)}</th>
        ))}
      </>
    </tr>
  </thead>
)
AssessmentsTableHeader.propTypes = {
  periodsConfig: periodsConfigPropType
}

const InstantAssessmentRow = ({
  questionKey,
  questionConfig,
  entity,
  periods
}) => {
  const aggWidgetProps = {
    widget: questionConfig.aggregation?.widget || questionConfig.widget,
    aggregationType: questionConfig.aggregation?.aggregationType,
    vertical: true
  }
  const fieldProps = getFieldPropsFromFieldConfig(questionConfig)
  return (
    <tr>
      {periods.map((period, index) => (
        <td key={index}>
          <AggregationWidget
            key={`assessment-${questionKey}`}
            values={entity.getInstantAssessmentResults(period)[questionKey]}
            {...aggWidgetProps}
            {...fieldProps}
          />
        </td>
      ))}
    </tr>
  )
}
InstantAssessmentRow.propTypes = {
  entity: PropTypes.object,
  periods: periodsPropType,
  questionKey: PropTypes.string,
  questionConfig: PropTypes.object
}

const PeriodicAssessmentRows = ({
  entity,
  entityType,
  periodsConfig,
  canAddAssessment,
  onAddAssessment
}) => {
  const { recurrence, periods } = periodsConfig
  const {
    assessmentConfig: periodicAssessmentConfig,
    assessmentYupSchema: periodicAssessmentYupSchema
  } = entity.getPeriodicAssessmentDetails(recurrence)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const periodsLastAssessment = []
  const periodsAllowNewAssessment = []
  periods.forEach(period => {
    // TODO: rethink assessments for a period: should we also save the period
    // in the assessment? For now we assume that the dateRange is a month and
    // that assessments for a given month will have been made in the next month.
    periodsLastAssessment.push(
      entity.getLastAssessment({
        start: period.start.clone().add(1, "months"),
        end: period.start.clone().add(1, "months").endOf("month")
      })
    )
    periodsAllowNewAssessment.push(
      periodicAssessmentConfig && canAddAssessment && period.allowNewAssessments
    )
  })
  const rowHasLastAssessments = !_isEmpty(
    periodsLastAssessment.filter(x => !_isEmpty(x))
  )
  const rowHasAddAssessment = !_isEmpty(
    periodsAllowNewAssessment.filter(x => x)
  )

  return (
    <>
      {rowHasLastAssessments && (
        <tr>
          {periodsLastAssessment.map((lastAssessment, index) => {
            const lastAssessmentParentFieldName = `lastAssessment-${entity.uuid}-${index}`
            return (
              <td key={index}>
                {periodicAssessmentConfig && lastAssessment && (
                  <Formik
                    enableReinitialize
                    initialValues={{
                      [lastAssessmentParentFieldName]: lastAssessment
                    }}
                  >
                    {({ values }) => (
                      <ReadonlyCustomFields
                        parentFieldName={lastAssessmentParentFieldName}
                        fieldsConfig={periodicAssessmentConfig}
                        values={values}
                        vertical
                      />
                    )}
                  </Formik>
                )}
              </td>
            )
          })}
        </tr>
      )}
      {rowHasAddAssessment && (
        <tr>
          {periods.map((period, index) => {
            const periodDisplay = periodToString(period)
            const assessmentLabelPrefix = periodsLastAssessment[index]
              ? "Add a"
              : "Make a new"
            const addAssessmentLabel = `${assessmentLabelPrefix} ${entity?.toString()} assessment for ${periodDisplay}`
            return (
              <td key={index}>
                {periodsAllowNewAssessment[index] && (
                  <>
                    <Button
                      bsStyle="primary"
                      onClick={() => setShowAssessmentModal(true)}
                    >
                      {addAssessmentLabel}
                    </Button>
                    <AddAssessmentModal
                      entity={entity}
                      entityType={entityType}
                      title={`Assessment for ${entity.toString()} for ${periodDisplay}`}
                      yupSchema={periodicAssessmentYupSchema}
                      recurrence="monthly"
                      assessmentPeriod={period}
                      assessmentConfig={periodicAssessmentConfig}
                      showModal={showAssessmentModal}
                      onCancel={() => setShowAssessmentModal(false)}
                      onSuccess={() => {
                        setShowAssessmentModal(false)
                        onAddAssessment()
                      }}
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
PeriodicAssessmentRows.propTypes = {
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  periodsConfig: periodsConfigPropType,
  canAddAssessment: PropTypes.bool,
  onAddAssessment: PropTypes.func
}

const EntityAssessmentResults = ({
  entity,
  entityType,
  style,
  periodsConfig,
  canAddAssessment,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  const instantAssessmentConfig = entity.getInstantAssessmentConfig()
  const { periods } = periodsConfig
  return (
    <>
      <tr>
        <td colSpan={periods.length} className="entity-title-row">
          <LinkTo modelType={entityType.resourceName} model={entity} />
        </td>
      </tr>
      {Object.keys(instantAssessmentConfig || {}).map(key => (
        <InstantAssessmentRow
          key={key}
          questionKey={key}
          questionConfig={instantAssessmentConfig[key]}
          periods={periods}
          entity={entity}
        />
      ))}
      <PeriodicAssessmentRows
        entity={entity}
        entityType={entityType}
        periodsConfig={periodsConfig}
        canAddAssessment={canAddAssessment}
        onAddAssessment={onAddAssessment}
      />
    </>
  )
}
EntityAssessmentResults.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  periodsConfig: periodsConfigPropType,
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

const AssessmentResultsTable = ({
  entity,
  entityType,
  subEntities,
  style,
  periodsConfig,
  canAddAssessment,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  const { recurrence } = periodsConfig
  const entityInstantAssessmentConfig = entity.getInstantAssessmentConfig()
  const subentitiesInstantAssessmentConfig = subEntities
    ?.map(s => s.getInstantAssessmentConfig())
    .filter(mc => !_isEmpty(mc))
  const {
    assessmentConfig: periodicAssessmentConfig
  } = entity.getPeriodicAssessmentDetails(recurrence)
  const showAssessmentResults =
    !_isEmpty(entityInstantAssessmentConfig) ||
    !_isEmpty(subentitiesInstantAssessmentConfig) ||
    !_isEmpty(periodicAssessmentConfig)
  return (
    <>
      {showAssessmentResults && (
        <div style={{ ...style }}>
          <Fieldset
            title={`Assessment results - ${recurrence}`}
            id={`"entity-assessments-results-${recurrence}`}
          >
            <Table condensed responsive className="assessments-table">
              <AssessmentsTableHeader periodsConfig={periodsConfig} />
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
                  onAddAssessment={onAddAssessment}
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
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  periodsConfig: periodsConfigPropType,
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsTable
