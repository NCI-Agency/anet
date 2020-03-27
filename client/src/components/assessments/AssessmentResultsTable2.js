import AggregationWidget from "components/AggregationWidgets"
import AddAssessmentModal from "components/assessments/AddAssessmentModal"
import { ReadonlyCustomFields } from "components/CustomFields"
import Fieldset from "components/Fieldset"
import { Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"

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

const AssessmentsTableHeader = ({ title, periods }) => (
  <thead>
    {title && (
      <tr key="title">
        <th colSpan={periods.length}>{title}</th>
      </tr>
    )}
    <tr key="periods">
      <>
        {periods.map(period => (
          <th key={period.start}>{period.start.format("MMM-YYYY")}</th>
        ))}
      </>
    </tr>
  </thead>
)
AssessmentsTableHeader.propTypes = {
  title: PropTypes.string,
  periods: PropTypes.array
}

const MeasurementRow = ({ measurementKey, measurementDef, data }) => {
  const aggWidgetProps = {
    widget: measurementDef.aggregation?.widget || measurementDef.widget,
    aggregationType: measurementDef.aggregation?.aggregationType,
    vertical: true
  }
  const widgetLayoutConfig = Object.without(
    measurementDef,
    "aggregation",
    "type",
    "typeError",
    "placeholder",
    "helpText",
    "validations",
    "visibleWhen",
    "objectFields"
  )
  return (
    <tr>
      {data.map((assessment, index) => (
        <td key={index}>
          <AggregationWidget
            key={`assessment-${measurementKey}`}
            values={assessment[measurementKey]}
            {...aggWidgetProps}
            {...widgetLayoutConfig}
          />
        </td>
      ))}
    </tr>
  )
}
MeasurementRow.propTypes = {
  measurementKey: PropTypes.string,
  measurementDef: PropTypes.object,
  data: PropTypes.array
}

const MonthlyAssessmentRow = ({
  entity,
  assessmentPeriods,
  canAddAssessment,
  onAddAssessment
}) => {
  const periodAssessmentConfig = entity.periodAssessmentConfig()
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  return (
    <tr>
      {assessmentPeriods.map((period, index) => {
        const lastAssessment = entity.getLastAssessment(period)
        const lastAssessmentPrefix = `lastAssessment-${entity.uuid}-${index}`
        const allowAddAssessment =
          periodAssessmentConfig &&
          period.allowNewAssessments &&
          canAddAssessment
        const assessmentLabelPrefix = lastAssessment ? "Add a" : "Make a new"
        const addAssessmentLabel = `${assessmentLabelPrefix} ${entity?.toString()} assessment for the month of ${period.start.format(
          "MMM-YYYY"
        )}`
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
            {allowAddAssessment && (
              <>
                <Button
                  bsStyle="primary"
                  onClick={() => setShowAssessmentModal(true)}
                >
                  {addAssessmentLabel}
                </Button>
                <AddAssessmentModal
                  task={entity}
                  assessmentPeriod={period}
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
  )
}
MonthlyAssessmentRow.propTypes = {
  entity: PropTypes.object,
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

const EntityAssessmentResultsTable = ({
  entity,
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
  const assessmentResults = assessmentPeriods.map(p =>
    entity.getAssessmentResults(p)
  )
  return (
    <Table striped bordered condensed hover responsive>
      <AssessmentsTableHeader
        title={entity?.toString()}
        periods={assessmentPeriods}
      />
      <tbody>
        {Object.keys(assessmentDefinition || {}).map(key => (
          <MeasurementRow
            key={key}
            measurementKey={key}
            measurementDef={assessmentDefinition[key]}
            data={assessmentResults}
          />
        ))}
        <MonthlyAssessmentRow
          entity={entity}
          assessmentPeriods={assessmentPeriods}
          canAddAssessment={canAddAssessment}
          onAddAssessment={onAddAssessment}
        />
      </tbody>
    </Table>
  )
}
EntityAssessmentResultsTable.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
  assessmentPeriods: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.object,
      end: PropTypes.object
    })
  ),
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

const AssessmentResultsTable2 = ({
  entity,
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
    <>
      <div style={{ ...style }}>
        <Fieldset
          title={`${entity.toString()} assessment results`}
          id="entity-assessments-results"
        >
          <EntityAssessmentResultsTable
            style={{ flex: "0 0 100%" }}
            entity={entity}
            assessmentPeriods={assessmentPeriods}
            canAddAssessment={canAddAssessment}
            onAddAssessment={onAddAssessment}
          />
        </Fieldset>
      </div>
      <>
        {!_isEmpty(subEntities) && (
          <Fieldset
            title="Subtasks assessment results"
            id="subentities-assessments-results"
          >
            {subEntities?.map(subEntity => (
              <EntityAssessmentResultsTable
                key={`subassessment-${subEntity.uuid}`}
                entity={subEntity}
                assessmentPeriods={assessmentPeriods}
                canAddAssessment={false}
              />
            ))}
          </Fieldset>
        )}
      </>
    </>
  )
}
AssessmentResultsTable2.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
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

export default AssessmentResultsTable2
