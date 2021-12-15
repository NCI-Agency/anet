import Model from "components/Model"
import {
  PERIOD_FACTORIES,
  RECURRENCE_TYPE,
  useResponsiveNumberOfPeriods
} from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import OnDemandAssessment from "./ondemand/OndemandAssessment"
import PeriodicAssessmentResultsTable from "./periodic/PeriodicAssessmentResultsTable"

const AssessmentResultsContainer = ({
  entity,
  entityType,
  subEntities,
  canAddPeriodicAssessment,
  canAddOndemandAssessment,
  onUpdateAssessment
}) => {
  const [numberOfPeriods, setNumberOfPeriods] = useState(3)
  const contRef = useResponsiveNumberOfPeriods(setNumberOfPeriods)

  if (!entity) {
    return null
  }
  const entityAssessments = Object.entries(entity.getAssessmentsConfig())
  return (
    <div ref={contRef}>
      {entityAssessments.map(([assessmentKey, entityAssessment]) =>
        PERIOD_FACTORIES[entityAssessment.recurrence] ? (
          <PeriodicAssessmentResultsTable
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
            canAddAssessment={canAddPeriodicAssessment}
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
              canAddAssessment={canAddOndemandAssessment}
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
  canAddPeriodicAssessment: PropTypes.bool,
  canAddOndemandAssessment: PropTypes.bool
}
AssessmentResultsContainer.defaultProps = {
  canAddPeriodicAssessment: false,
  canAddOndemandAssessment: false
}

export default AssessmentResultsContainer
