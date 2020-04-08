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
 * - aggregation of the measurements made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks);
 *   the definition of these assessments is to be found in
 *   entity.customFields.assessmentDefinition
 * - display of the last monthly assessment made on the entity/subentities
 *   as a conclusion about the given period of time;
 *   the definition of these assessments is to be found in
 *   entity.periodAssessmentConfig()
 */

const PERIOD_FORMAT = "MMM-YYYY"

const AssessmentsTableHeader = ({ periods }) => (
  <thead>
    <tr key="periods">
      <>
        {periods.map(period => (
          <th key={period.start}>{period.start.format(PERIOD_FORMAT)}</th>
        ))}
      </>
    </tr>
  </thead>
)
AssessmentsTableHeader.propTypes = {
  periods: PropTypes.array
}

const MeasurementRow = ({
  measurementKey,
  measurementDef,
  entity,
  assessmentPeriods
}) => {
  const aggWidgetProps = {
    widget: measurementDef.aggregation?.widget || measurementDef.widget,
    aggregationType: measurementDef.aggregation?.aggregationType,
    vertical: true
  }
  const fieldProps = getFieldPropsFromFieldConfig(measurementDef)
  return (
    <tr>
      {assessmentPeriods.map((assessmentPeriod, index) => (
        <td key={index}>
          <AggregationWidget
            key={`assessment-${measurementKey}`}
            values={
              entity.getAssessmentResults(assessmentPeriod)[measurementKey]
            }
            {...aggWidgetProps}
            {...fieldProps}
          />
        </td>
      ))}
    </tr>
  )
}
MeasurementRow.propTypes = {
  entity: PropTypes.object,
  assessmentPeriods: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.object,
      end: PropTypes.object,
      allowNewAssessments: PropTypes.bool
    })
  ),
  measurementKey: PropTypes.string,
  measurementDef: PropTypes.object
}

const MonthlyAssessmentRows = ({
  entity,
  entityType,
  assessmentPeriods,
  canAddAssessment,
  onAddAssessment
}) => {
  const periodAssessmentConfig = entity.periodAssessmentConfig()
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const periodsLastAssessment = []
  const periodsAllowNewAssessment = []
  assessmentPeriods.forEach(period => {
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
      periodAssessmentConfig && canAddAssessment && period.allowNewAssessments
    )
  })
  const hasLastAssessments = !_isEmpty(
    periodsLastAssessment.filter(x => !_isEmpty(x))
  )
  const hasAddAssessment = !_isEmpty(periodsAllowNewAssessment.filter(x => x))
  return (
    <>
      {hasLastAssessments && (
        <tr>
          {periodsLastAssessment.map((lastAssessment, index) => {
            const lastAssessmentPrefix = `lastAssessment-${entity.uuid}-${index}`
            return (
              <td key={index}>
                {periodAssessmentConfig && lastAssessment && (
                  <Formik
                    enableReinitialize
                    initialValues={{
                      [lastAssessmentPrefix]: lastAssessment
                    }}
                  >
                    {({ values }) => (
                      <ReadonlyCustomFields
                        fieldNamePrefix={lastAssessmentPrefix}
                        fieldsConfig={periodAssessmentConfig}
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
      {hasAddAssessment && (
        <tr>
          {assessmentPeriods.map((period, index) => {
            const assessmentLabelPrefix = periodsLastAssessment[index]
              ? "Add a"
              : "Make a new"
            const addAssessmentLabel = `${assessmentLabelPrefix} ${entity?.toString()} assessment for the month of ${period.start.format(
              PERIOD_FORMAT
            )}`
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
                      title={`Assessment for ${
                        entity.shortName
                      } for ${period.start.format(PERIOD_FORMAT)}`}
                      yupSchema={entity.periodAssessmentYupSchema()}
                      assessmentConfig={entity.periodAssessmentConfig()}
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
MonthlyAssessmentRows.propTypes = {
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  assessmentPeriods: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.object,
      end: PropTypes.object,
      allowNewAssessments: PropTypes.bool
    })
  ),
  canAddAssessment: PropTypes.bool,
  onAddAssessment: PropTypes.func
}

const EntityAssessmentResults = ({
  entity,
  entityType,
  style,
  assessmentPeriods,
  canAddAssessment,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  const assessmentDefinition = JSON.parse(
    JSON.parse(entity.customFields || "{}").assessmentDefinition || "{}"
  )
  return (
    <>
      <tr>
        <td colSpan={assessmentPeriods.length} className="entity-title-row">
          <LinkTo modelType="Task" model={entity} />
        </td>
      </tr>
      {Object.keys(assessmentDefinition || {}).map(key => (
        <MeasurementRow
          key={key}
          measurementKey={key}
          measurementDef={assessmentDefinition[key]}
          assessmentPeriods={assessmentPeriods}
          entity={entity}
        />
      ))}
      <MonthlyAssessmentRows
        entity={entity}
        entityType={entityType}
        assessmentPeriods={assessmentPeriods}
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
  assessmentPeriods: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.object,
      end: PropTypes.object,
      allowNewAssessments: PropTypes.bool
    })
  ),
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

const AssessmentResultsTable = ({
  entity,
  entityType,
  subEntities,
  style,
  assessmentPeriods,
  canAddAssessment,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  return (
    <div style={{ ...style }}>
      <Fieldset title="Assessment results" id="entity-assessments-results">
        <Table condensed responsive className="assessments-table">
          <AssessmentsTableHeader periods={assessmentPeriods} />
          <tbody>
            {!_isEmpty(subEntities) && (
              <>
                {subEntities?.map(subEntity => (
                  <EntityAssessmentResults
                    key={`subassessment-${subEntity.uuid}`}
                    entity={subEntity}
                    entityType={entityType}
                    assessmentPeriods={assessmentPeriods}
                    canAddAssessment={false}
                  />
                ))}
              </>
            )}
            <EntityAssessmentResults
              entity={entity}
              entityType={entityType}
              assessmentPeriods={assessmentPeriods}
              canAddAssessment={canAddAssessment}
              onAddAssessment={onAddAssessment}
            />
          </tbody>
        </Table>
      </Fieldset>
    </div>
  )
}
AssessmentResultsTable.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  assessmentPeriods: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.object,
      end: PropTypes.object,
      allowNewAssessments: PropTypes.bool
    })
  ),
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsTable
