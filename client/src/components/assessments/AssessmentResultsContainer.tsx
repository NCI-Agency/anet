import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import {
  PERIOD_FACTORIES,
  RECURRENCE_TYPE,
  useResponsiveNumberOfPeriods
} from "periodUtils"
import React, { useState } from "react"
import "./AssessmentResultsContainer.css"
import InstantAssessmentResultsTable from "./instant/InstantAssessmentResultsTable"
import OnDemandAssessment from "./ondemand/OndemandAssessment"
import PeriodicAssessmentResultsTable from "./periodic/PeriodicAssessmentResultsTable"

interface AssessmentResultsContainerProps {
  entity?: typeof Model
  entityType: (...args: unknown[]) => unknown
  subEntities?: any[]
  onUpdateAssessment: (...args: unknown[]) => unknown
  canAddPeriodicAssessment?: boolean
  canAddOndemandAssessment?: boolean
}

const AssessmentResultsContainer = ({
  entity,
  entityType,
  subEntities,
  canAddPeriodicAssessment = false,
  canAddOndemandAssessment = false,
  onUpdateAssessment
}: AssessmentResultsContainerProps) => {
  const [numberOfPeriods, setNumberOfPeriods] = useState(3)
  const contRef = useResponsiveNumberOfPeriods(setNumberOfPeriods)

  if (!entity) {
    return null
  }
  const entityAssessments = Object.entries(entity.getAssessmentsConfig() ?? {})
  return (
    <div ref={contRef}>
      {entityAssessments.map(([assessmentKey, entityAssessment]) => {
        if (
          PERIOD_FACTORIES[entityAssessment.recurrence] ||
          entityAssessment.recurrence === RECURRENCE_TYPE.ON_DEMAND
        ) {
          // can only filter periodic and ondemand assessments
          // (we lack sufficient context for filtering instant ['once'] assessments)
          if (
            _isEmpty(Model.filterAssessmentConfig(entityAssessment, entity))
          ) {
            // assessment does not apply
            return null
          }
        }
        let resultsTable
        if (entityAssessment.recurrence === RECURRENCE_TYPE.ONCE) {
          resultsTable = (
            <InstantAssessmentResultsTable
              assessmentKey={assessmentKey}
              style={{ flex: "0 0 100%" }}
              entity={entity}
              entityType={entityType}
              subEntities={subEntities}
              periodsDetails={{
                recurrence: RECURRENCE_TYPE.MONTHLY,
                numberOfPeriods
              }}
            />
          )
        } else if (PERIOD_FACTORIES[entityAssessment.recurrence]) {
          resultsTable = (
            <PeriodicAssessmentResultsTable
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
          )
        } else if (entityAssessment.recurrence === RECURRENCE_TYPE.ON_DEMAND) {
          resultsTable = (
            <OnDemandAssessment
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
        }
        return (
          <React.Fragment key={assessmentKey}>{resultsTable}</React.Fragment>
        )
      })}
    </div>
  )
}

export default AssessmentResultsContainer
