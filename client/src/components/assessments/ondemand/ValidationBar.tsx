import {
  ENTITY_ON_DEMAND_ASSESSMENT_DATE,
  ENTITY_ON_DEMAND_EXPIRATION_DATE
} from "components/Model"
import moment from "moment"
import React from "react"
import { Badge } from "react-bootstrap"

interface ValidationBarProps {
  assessmentExpirationDays?: number
  index: number
  assessmentFieldsObject: any
  sortedOnDemandAssessments: any[]
}

const ValidationBar = ({
  assessmentExpirationDays,
  index,
  assessmentFieldsObject,
  sortedOnDemandAssessments
}: ValidationBarProps) => {
  if (assessmentExpirationDays) {
    // Fill the 'expirationDate' field if it is empty
    if (!assessmentFieldsObject[ENTITY_ON_DEMAND_EXPIRATION_DATE]) {
      assessmentFieldsObject[ENTITY_ON_DEMAND_EXPIRATION_DATE] = moment(
        assessmentFieldsObject[ENTITY_ON_DEMAND_ASSESSMENT_DATE]
      )
        .add(assessmentExpirationDays, "days")
        .toDate()
        .toISOString()
    }
    return (
      <div
        className={
          moment(
            assessmentFieldsObject[ENTITY_ON_DEMAND_EXPIRATION_DATE]
          ).isBefore(moment())
            ? index === sortedOnDemandAssessments.length - 1
              ? "ondemand-red-validation-text"
              : "ondemand-grey-validation-text"
            : index === sortedOnDemandAssessments.length - 1
              ? "ondemand-green-validation-text"
              : "ondemand-grey-validation-text"
        }
      >
        {/* Only the last object in the sortedOnDemandAssessments can be valid.
                  If the expiration date of the last object is older than NOW,
                  it is also expired. */}
        {moment(
          assessmentFieldsObject[ENTITY_ON_DEMAND_EXPIRATION_DATE]
        ).isBefore(moment()) ? (
          "Expired"
        ) : index !== sortedOnDemandAssessments.length - 1 ? (
          "No longer valid"
        ) : (
          <>
            Valid until{" "}
            {moment(
              assessmentFieldsObject[ENTITY_ON_DEMAND_EXPIRATION_DATE]
            ).format("DD MMMM YYYY")}{" "}
            <Badge bg="secondary" style={{ paddingBottom: "3px" }}>
              {/* true flag in the diff function returns the precise days
                          between two dates, e.g., '1,4556545' days. 'ceil' function
                          from Math library is used to round it to the nearest greatest
                          integer so that user sees an integer as the number of days left */}
              {Math.ceil(
                moment(
                  assessmentFieldsObject[ENTITY_ON_DEMAND_EXPIRATION_DATE]
                ).diff(moment(), "days", true)
              )}{" "}
              of{" "}
              {moment(
                assessmentFieldsObject[ENTITY_ON_DEMAND_EXPIRATION_DATE]
              ).diff(
                moment(
                  assessmentFieldsObject[ENTITY_ON_DEMAND_ASSESSMENT_DATE]
                ),
                "days"
              )}{" "}
              days left
            </Badge>
          </>
        )}
      </div>
    )
  } else {
    return (
      <>
        {index === sortedOnDemandAssessments.length - 1 ? (
          <div className="ondemand-green-validation-text">Valid</div>
        ) : (
          <div className="ondemand-grey-validation-text">No longer valid</div>
        )}
      </>
    )
  }
}

export default ValidationBar
