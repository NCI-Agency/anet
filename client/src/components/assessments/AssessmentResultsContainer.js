import AssessmentResultsTable from "components/assessments/AssessmentResultsTable"
import Model from "components/Model"
import {
  PERIOD_FACTORIES,
  useLessNumberOfPeriodsOnSmallScreens
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
  useLessNumberOfPeriodsOnSmallScreens(setNumberOfPeriods)
  if (!entity) {
    return null
  }
  const assessmentsTypes = Object.keys(entity.getAssessmentsConfig())
  return (
    <>
      {assessmentsTypes.map(
        assessmentsType =>
          PERIOD_FACTORIES[assessmentsType] && (
            <AssessmentResultsTable
              key={assessmentsType}
              style={{ flex: "0 0 100%" }}
              entity={entity}
              entityType={entityType}
              subEntities={subEntities}
              periodsDetails={{
                recurrence: assessmentsType,
                numberOfPeriods
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
  entity: PropTypes.instanceOf(Model),
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  onUpdateAssessment: PropTypes.func.isRequired,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsContainer
