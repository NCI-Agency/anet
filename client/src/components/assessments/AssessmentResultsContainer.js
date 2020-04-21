import AssessmentResultsTable from "components/assessments/AssessmentResultsTable"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"

const now = moment()
const ASSESSMENT_PERIODS_CONFIG = [
  {
    recurrence: "daily",
    periods: [
      {
        start: now.clone().subtract(2, "days").startOf("day"),
        end: now.clone().subtract(2, "days").endOf("day"),
        allowNewAssessments: false
      },
      {
        start: now.clone().subtract(1, "days").startOf("day"),
        end: now.clone().subtract(1, "days").endOf("day"),
        allowNewAssessments: true
      },
      {
        start: now.clone().startOf("day"),
        end: now.clone().endOf("day"),
        allowNewAssessments: false
      }
    ]
  },
  {
    recurrence: "weekly",
    periods: [
      {
        start: now.clone().subtract(2, "weeks").startOf("week"),
        end: now.clone().subtract(2, "weeks").endOf("week"),
        allowNewAssessments: false
      },
      {
        start: now.clone().subtract(1, "weeks").startOf("week"),
        end: now.clone().subtract(1, "weeks").endOf("week"),
        allowNewAssessments: true
      },
      {
        start: now.clone().startOf("week"),
        end: now.clone().endOf("week"),
        allowNewAssessments: false
      }
    ]
  },
  {
    recurrence: "biweekly",
    periods: [
      {
        start: now.clone().subtract(4, "weeks").startOf("week"),
        end: now.clone().subtract(4, "weeks").endOf("week"),
        allowNewAssessments: false
      },
      {
        start: now.clone().subtract(2, "weeks").startOf("week"),
        end: now.clone().subtract(2, "weeks").endOf("week"),
        allowNewAssessments: true
      },
      {
        start: now.clone().startOf("week"),
        end: now.clone().endOf("week"),
        allowNewAssessments: false
      }
    ]
  },
  {
    recurrence: "monthly",
    periods: [
      {
        start: now.clone().subtract(2, "months").startOf("month"),
        end: now.clone().subtract(2, "months").endOf("month"),
        allowNewAssessments: false
      },
      {
        start: now.clone().subtract(1, "months").startOf("month"),
        end: now.clone().subtract(1, "months").endOf("month"),
        allowNewAssessments: true
      },
      {
        start: now.clone().startOf("month"),
        end: now.clone().endOf("month"),
        allowNewAssessments: false
      }
    ]
  },
  {
    recurrence: "quarterly",
    periods: [
      {
        start: now.clone().subtract(2, "quarters").startOf("quarter"),
        end: now.clone().subtract(2, "quarters").endOf("quarter"),
        allowNewAssessments: false
      },
      {
        start: now.clone().subtract(1, "quarters").startOf("quarter"),
        end: now.clone().subtract(1, "quarters").endOf("quarter"),
        allowNewAssessments: true
      },
      {
        start: now.clone().startOf("quarter"),
        end: now.clone().endOf("quarter"),
        allowNewAssessments: false
      }
    ]
  },
  {
    recurrence: "semiannualy",
    periods: [
      {
        start: now.clone().subtract(4, "quarters").startOf("quarter"),
        end: now.clone().subtract(4, "quarters").endOf("quarter"),
        allowNewAssessments: false
      },
      {
        start: now.clone().subtract(2, "quarters").startOf("quarter"),
        end: now.clone().subtract(2, "quarters").endOf("quarter"),
        allowNewAssessments: true
      },
      {
        start: now.clone().startOf("quarter"),
        end: now.clone().endOf("quarter"),
        allowNewAssessments: false
      }
    ]
  }
]

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
