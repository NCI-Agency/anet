import AssessmentResultsTable from "components/assessments/AssessmentResultsTable"
import { ASSESSMENTS_RECURRENCE_TYPE } from "components/Model"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"

const now = moment()
const ASSESSMENT_PERIODS_CONFIG = [
  {
    recurrence: ASSESSMENTS_RECURRENCE_TYPE.DAILY,
    periods: [
      {
        start: now.clone().subtract(2, "days").startOf("day"),
        end: now.clone().subtract(2, "days").endOf("day")
      },
      {
        start: now.clone().subtract(1, "days").startOf("day"),
        end: now.clone().subtract(1, "days").endOf("day")
      },
      {
        start: now.clone().startOf("day"),
        end: now.clone().endOf("day")
      }
    ]
  },
  {
    recurrence: ASSESSMENTS_RECURRENCE_TYPE.WEEKLY,
    periods: [
      {
        start: now.clone().subtract(2, "weeks").startOf("week"),
        end: now.clone().subtract(2, "weeks").endOf("week")
      },
      {
        start: now.clone().subtract(1, "weeks").startOf("week"),
        end: now.clone().subtract(1, "weeks").endOf("week")
      },
      {
        start: now.clone().startOf("week"),
        end: now.clone().endOf("week")
      }
    ]
  },
  {
    // FIXME: biweekly should be each 2 weeks from the beginning of the year
    recurrence: ASSESSMENTS_RECURRENCE_TYPE.BIWEEKLY,
    periods: [
      {
        start: now.clone().subtract(4, "weeks").startOf("week"),
        end: now.clone().subtract(4, "weeks").endOf("week")
      },
      {
        start: now.clone().subtract(2, "weeks").startOf("week"),
        end: now.clone().subtract(2, "weeks").endOf("week")
      },
      {
        start: now.clone().startOf("week"),
        end: now.clone().endOf("week")
      }
    ]
  },
  {
    recurrence: ASSESSMENTS_RECURRENCE_TYPE.MONTHLY,
    periods: [
      {
        start: now.clone().subtract(2, "months").startOf("month"),
        end: now.clone().subtract(2, "months").endOf("month")
      },
      {
        start: now.clone().subtract(1, "months").startOf("month"),
        end: now.clone().subtract(1, "months").endOf("month")
      },
      {
        start: now.clone().startOf("month"),
        end: now.clone().endOf("month")
      }
    ]
  },
  {
    recurrence: ASSESSMENTS_RECURRENCE_TYPE.QUARTERLY,
    periods: [
      {
        start: now.clone().subtract(2, "quarters").startOf("quarter"),
        end: now.clone().subtract(2, "quarters").endOf("quarter")
      },
      {
        start: now.clone().subtract(1, "quarters").startOf("quarter"),
        end: now.clone().subtract(1, "quarters").endOf("quarter")
      },
      {
        start: now.clone().startOf("quarter"),
        end: now.clone().endOf("quarter")
      }
    ]
  },
  {
    recurrence: ASSESSMENTS_RECURRENCE_TYPE.SEMIANNUALY,
    periods: [
      {
        start: now.clone().subtract(4, "quarters").startOf("quarter"),
        end: now.clone().subtract(4, "quarters").endOf("quarter")
      },
      {
        start: now.clone().subtract(2, "quarters").startOf("quarter"),
        end: now.clone().subtract(2, "quarters").endOf("quarter")
      },
      {
        start: now.clone().startOf("quarter"),
        end: now.clone().endOf("quarter")
      }
    ]
  }
]
// set default allowNewAssessments when this one is not configured for a period
ASSESSMENT_PERIODS_CONFIG.forEach(periodConfig =>
  periodConfig.periods.forEach(period => {
    if (period.allowNewAssessments === undefined) {
      period.allowNewAssessments = period.end < now.clone().startOf("day")
    }
  })
)

const AssessmentResultsContainer = ({
  entity,
  entityType,
  subEntities,
  canAddAssessment,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  const assessmentsTypes = Object.keys(entity.getAssessmentsConfig())
  return (
    <>
      {ASSESSMENT_PERIODS_CONFIG.map(periodsConfig => {
        return (
          assessmentsTypes.includes(periodsConfig.recurrence) && (
            <AssessmentResultsTable
              key={periodsConfig.recurrence}
              style={{ flex: "0 0 100%" }}
              entity={entity}
              entityType={entityType}
              subEntities={subEntities}
              periodsConfig={periodsConfig}
              canAddAssessment={canAddAssessment}
              onAddAssessment={onAddAssessment}
            />
          )
        )
      })}
    </>
  )
}
AssessmentResultsContainer.propTypes = {
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsContainer
