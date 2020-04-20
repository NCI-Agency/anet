import AssessmentResultsTable from "components/assessments/AssessmentResultsTable"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"

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

const now = moment()
const ASSESSMENT_PERIODS_CONFIG = [
  {
    recurrence: "daily",
    displayFormat: "DD-MM-YYYY",
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
    displayFormat: "DD-MM-YYYY",
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
    displayFormat: "DD-MM-YYYY",
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
    displayFormat: "MMM-YYYY",
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
    displayFormat: "DD-MM-YYYY",
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
    displayFormat: "DD-MM-YYYY",
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
