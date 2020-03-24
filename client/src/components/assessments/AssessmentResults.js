import AggregationWidget from "components/AggregationWidgets"
import AddAssessmentModal from "components/assessments/AddAssessmentModal"
// import { ReadonlyCustomFields } from "components/CustomFields"
import Fieldset from "components/Fieldset"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"

const AssessmentResults = ({
  assessmentPeriod,
  entity,
  label,
  subEntities,
  style,
  assessmentCustomFields,
  refetch,
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

          {/* {lastAssessment && (
            <ReadonlyCustomFields
              fieldNamePrefix="lastAssessment"
              fieldsConfig={assessmentCustomFields}
              formikProps={{
                formikProps
              }}
              vertical
            />
          )} */}

          {canEdit && assessmentCustomFields && (
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
                  refetch()
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
  label: PropTypes.string,
  assessmentPeriod: PropTypes.shape({
    start: PropTypes.object,
    end: PropTypes.object
  }),
  entity: PropTypes.object,
  subEntities: PropTypes.array,
  canEdit: PropTypes.bool,
  assessmentCustomFields: PropTypes.object,
  style: PropTypes.object,
  refetch: PropTypes.func
}

export default AssessmentResults
