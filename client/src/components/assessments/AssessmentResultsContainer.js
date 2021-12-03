import AssessmentResultsTable from "components/assessments/AssessmentResultsTable"
import OnDemandAssessment from "components/assessments/OnDemandAssessments/OndemandAssessment"
import Model from "components/Model"
import {
  PERIOD_FACTORIES,
  RECURRENCE_TYPE,
  useResponsiveNumberOfPeriods
} from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"

const AssessmentResultsContainer = ({
  entity,
  entityType,
  subEntities,
  canAddAssessment,
  onUpdateAssessment
}) => {
  const [numberOfPeriods, setNumberOfPeriods] = useState(3)
  const contRef = useResponsiveNumberOfPeriods(setNumberOfPeriods)

  if (!entity) {
    return null
  }
  // TODO: in principle, there can be more than one assessment definition for each recurrence,
  // so we should distinguish them here by key when we add that to the database.
  const entityAssessments = Object.entries(entity.getAssessmentsConfig())
  return (
    <div ref={contRef}>
      {entityAssessments.map(([assessmentKey, entityAssessment]) =>
        PERIOD_FACTORIES[entityAssessment.recurrence] ? (
          <AssessmentResultsTable
            key={assessmentKey}
            assessmentKey={assessmentKey}
            style={{ flex: "0 0 100%" }}
            entity={entity}
            entityType={entityType}
            subEntities={subEntities}
            periodsDetails={{
              recurrence: entityAssessment.recurrence,
              numberOfPeriods
            }}
            canAddAssessment={canAddAssessment}
            onUpdateAssessment={onUpdateAssessment}
          />
        ) : (
          entityAssessment.recurrence === RECURRENCE_TYPE.ON_DEMAND && (
            <OnDemandAssessment
              key={assessmentKey}
              assessmentKey={assessmentKey}
              style={{ flex: "0 0 100%" }}
              entity={entity}
              entityType={entityType}
              subEntities={subEntities}
              periodsDetails={{
                recurrence: entityAssessment.recurrence,
                numberOfPeriods
              }}
              canAddAssessment={canAddAssessment}
              onUpdateAssessment={onUpdateAssessment}
            />
          )
        )
      )}
    </div>
  )
}
AssessmentResultsContainer.propTypes = {
  entity: PropTypes.instanceOf(Model),
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsContainer
