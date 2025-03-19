import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import React from "react"
import { FormCheck, Table } from "react-bootstrap"

interface ApprovalStepsProps {
  approvalSteps?: any[]
  restrictedApprovalLabel?: string
}

const ApprovalSteps = ({
  approvalSteps = [],
  restrictedApprovalLabel
}: ApprovalStepsProps) => {
  return _isEmpty(approvalSteps) ? (
    <em>No approval steps found</em>
  ) : (
    <div style={{ display: "flex", flexFlow: "column" }}>
      {approvalSteps.map((step, idx) => (
        <div key={step.uuid}>
          <h5>
            Step {idx + 1}: {step.name}
          </h5>
          {restrictedApprovalLabel && (
            <FormCheck
              type="checkbox"
              label={restrictedApprovalLabel}
              checked={step.restrictedApproval}
              readOnly
            />
          )}
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Person</th>
                <th>Position</th>
              </tr>
            </thead>

            <tbody>
              {step.approvers.map((pos, idx) => (
                <tr
                  key={`${step.uuid}_${pos.uuid}`}
                  id={`step_${idx}_approver_${idx}`}
                >
                  <td>
                    <LinkTo
                      modelType="Person"
                      model={pos.person}
                      whenUnspecified="Unfilled"
                    />
                  </td>
                  <td>
                    <LinkTo modelType="Position" model={pos} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </div>
  )
}

export default ApprovalSteps
