import AssessmentResultsTable from "components/assessments/AssessmentResultsTable"
import { ASSESSMENTS_RECURRENCE_TYPE } from "components/Model"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"

const now = moment()

const ASSESSMENT_PERIOD_FACTORIES = {
  [ASSESSMENTS_RECURRENCE_TYPE.DAILY]: (date, offset) => ({
    start: date.clone().subtract(offset, "days").startOf("day"),
    end: date.clone().subtract(offset, "days").endOf("day")
  }),
  [ASSESSMENTS_RECURRENCE_TYPE.WEEKLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "weeks").startOf("week"),
    end: date.clone().subtract(offset, "weeks").endOf("week")
  }),
  // FIXME: biweekly should be each 2 weeks from the beginning of the year
  [ASSESSMENTS_RECURRENCE_TYPE.BIWEEKLY]: (date, offset) => ({
    start: date
      .clone()
      .subtract(2 * offset, "weeks")
      .startOf("week"),
    end: date
      .clone()
      .subtract(2 * offset, "weeks")
      .endOf("week")
  }),
  [ASSESSMENTS_RECURRENCE_TYPE.SEMIMONTHLY]: (date, offset) => ({
    start:
      date.date() < 15
        ? date.clone().subtract(offset, "months").startOf("month")
        : date.clone().subtract(offset, "months").startOf("month").date(15),
    end:
      date.date() < 15
        ? date.clone().subtract(offset, "months").startOf("month").date(14)
        : date.clone().subtract(offset, "months").endOf("month")
  }),
  [ASSESSMENTS_RECURRENCE_TYPE.MONTHLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "months").startOf("month"),
    end: date.clone().subtract(offset, "months").endOf("month")
  }),
  [ASSESSMENTS_RECURRENCE_TYPE.QUARTERLY]: (date, offset) => ({
    start: date.clone().subtract(offset, "quarters").startOf("quarter"),
    end: date.clone().subtract(offset, "quarters").endOf("quarter")
  }),
  [ASSESSMENTS_RECURRENCE_TYPE.SEMIANNUALY]: (date, offset) => ({
    start: date
      .clone()
      .subtract(2 * offset, "quarters")
      .startOf("quarter"),
    end: date
      .clone()
      .subtract(2 * offset, "quarters")
      .endOf("quarter")
  })
}

const AssessmentResultsContainer = ({
  entity,
  entityType,
  subEntities,
  canAddAssessment,
  onUpdateAssessment
}) => {
  if (!entity) {
    return null
  }
  const assessmentsTypes = Object.keys(entity.getAssessmentsConfig())
  return (
    <>
      {assessmentsTypes.map(
        assessmentsType =>
          ASSESSMENT_PERIOD_FACTORIES[assessmentsType] && (
            <AssessmentResultsTable
              key={assessmentsType}
              style={{ flex: "0 0 100%" }}
              entity={entity}
              entityType={entityType}
              subEntities={subEntities}
              periodsConfig={{
                recurrence: assessmentsType,
                periods: [
                  {
                    // Second Most recent completed period
                    ...ASSESSMENT_PERIOD_FACTORIES[assessmentsType](now, 2),
                    allowNewAssessments: true
                  },
                  {
                    // Most recent completed period
                    ...ASSESSMENT_PERIOD_FACTORIES[assessmentsType](now, 1),
                    allowNewAssessments: true
                  },
                  {
                    // Ongoing period
                    ...ASSESSMENT_PERIOD_FACTORIES[assessmentsType](now, 0),
                    allowNewAssessments: false
                  }
                ]
              }}
              canAddAssessment={canAddAssessment}
              onUpdateAssessment={onUpdateAssessment}
            />
          )
      )}
    </>
  )
}
AssessmentResultsContainer.propTypes = {
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  onUpdateAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsContainer
