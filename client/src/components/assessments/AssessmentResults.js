import AggregationWidget from "components/AggregationWidgets"
import AddAssessmentModal from "components/assessments/AddAssessmentModal"
import { ReadonlyCustomFields } from "components/CustomFields"
import Fieldset from "components/Fieldset"
import { Formik } from "formik"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"

/* The AssessmentResults component displays the results of two types of
 * assessments made on a given entity and subentities:
 * - aggregation of the assessments made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks);
 *   the definition of these assessments is to be found in
 *   entity.customFields.assessmentDefinition
 * - display of the last period related assessment made on the entity/subentities
 *   as a conclusion about the given period of time;
 *   the definition of these assessments is to be found in
 *   entity.periodAssessmentConfig()
 */
const AssessmentResults = ({
  assessmentPeriod,
  entity,
  label,
  subEntities,
  style,
  onAddAssessment,
  canEdit
}) => {
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)

  if (!entity) {
    return null
  }
  const assessmentDefinition = JSON.parse(
    JSON.parse(entity.customFields || "{}").assessmentDefinition || "{}"
  )
  const assessmentResultsWidgets = []
  // display one aggregation widget per assessment question
  Object.keys(assessmentDefinition || {}).forEach(key => {
    const aggWidgetProps = {
      widget:
        assessmentDefinition[key].aggregation?.widget ||
        assessmentDefinition[key].widget,
      aggregationType: assessmentDefinition[key].aggregation?.aggregationType,
      vertical: true
    }
    const widgetLayoutConfig = Object.without(
      assessmentDefinition[key],
      "aggregation",
      "type",
      "typeError",
      "placeholder",
      "helpText",
      "validations",
      "visibleWhen",
      "objectFields"
    )
    assessmentResultsWidgets.push(
      <AggregationWidget
        key={`assessment-${key}`}
        values={entity.getAssessmentResults(assessmentPeriod)[key]}
        {...aggWidgetProps}
        {...widgetLayoutConfig}
      />
    )
  })

  const periodAssessmentConfig = entity.periodAssessmentConfig()
  const lastAssessment = entity.getLastAssessment(assessmentPeriod)
  const assessmentLabelPrefix = lastAssessment ? "Add a" : "Make a new"
  const addAssessmentLabel = `${assessmentLabelPrefix} ${entity?.toString()} assessment for the month of ${assessmentPeriod.start.format(
    "MMM-YYYY"
  )}`

  return (
    <div style={{ ...style, margin: 10 }}>
      {assessmentResultsWidgets && (
        <Fieldset
          title={`${label} results for ${assessmentPeriod.start.format(
            "MMM-YYYY"
          )}`}
          id="assessments-results"
        >
          {assessmentResultsWidgets}

          {subEntities?.map(subEntity => (
            <AssessmentResults
              key={`subassessment-${subEntity.uuid}`}
              label={`${subEntity.toString()} ${label}`}
              entity={subEntity}
              assessmentPeriod={assessmentPeriod}
              canEdit={false}
            />
          ))}

          {periodAssessmentConfig && lastAssessment && (
            <Formik
              initialValues={{
                [`lastAssessment-${entity.uuid}`]: lastAssessment
              }}
            >
              {({ values }) => (
                <ReadonlyCustomFields
                  fieldNamePrefix={`lastAssessment-${entity.uuid}`}
                  fieldsConfig={periodAssessmentConfig}
                  values={values}
                  vertical
                />
              )}
            </Formik>
          )}

          {periodAssessmentConfig && canEdit && (
            <>
              <Button
                bsStyle="primary"
                onClick={() => setShowAssessmentModal(true)}
              >
                {addAssessmentLabel}
              </Button>
              <AddAssessmentModal
                task={entity}
                assessmentPeriod={assessmentPeriod}
                showModal={showAssessmentModal}
                onCancel={() => setShowAssessmentModal(false)}
                onSuccess={() => {
                  setShowAssessmentModal(false)
                  onAddAssessment()
                }}
              />
            </>
          )}
        </Fieldset>
      )}
    </div>
  )
}

AssessmentResults.propTypes = {
  assessmentPeriod: PropTypes.shape({
    start: PropTypes.object,
    end: PropTypes.object
  }),
  canEdit: PropTypes.bool,
  entity: PropTypes.object,
  label: PropTypes.string,
  onAddAssessment: PropTypes.func,
  style: PropTypes.object,
  subEntities: PropTypes.array
}

export default AssessmentResults
