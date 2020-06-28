import ApprovalSteps, {
  PLANNING_APPROVAL,
  PUBLICATION_APPROVAL
} from "components/approvals/ApprovalSteps"
import { Location, Organization, Task } from "models"
import PropTypes from "prop-types"
import React from "react"

const Approvals = ({ restrictedApprovalLabel, relatedObject }) => {
  return (
    <div>
      <ApprovalSteps
        type={PLANNING_APPROVAL}
        steps={relatedObject.planningApprovalSteps}
        restrictedApprovalLabel={restrictedApprovalLabel}
      />
      <ApprovalSteps
        type={PUBLICATION_APPROVAL}
        steps={relatedObject.approvalSteps}
        restrictedApprovalLabel={restrictedApprovalLabel}
      />
    </div>
  )
}

Approvals.propTypes = {
  restrictedApprovalLabel: PropTypes.string,
  relatedObject: PropTypes.oneOfType([
    PropTypes.instanceOf(Location),
    PropTypes.instanceOf(Organization),
    PropTypes.instanceOf(Task)
  ]).isRequired
}

export default Approvals
