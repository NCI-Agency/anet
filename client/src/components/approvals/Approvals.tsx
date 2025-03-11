import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import React from "react"
import { FormCheck, Table } from "react-bootstrap"

interface ApprovalsProps {
  restrictedApprovalLabel?: string
  relatedObject: any
}

const Approvals = ({
  restrictedApprovalLabel,
  relatedObject
}: ApprovalsProps) => {
  const { planningApprovalSteps, approvalSteps } = relatedObject

  return (
    <div>
      {planningApprovalSteps && (
        <Fieldset
          id="planningApprovals"
          title="Engagement planning approval process"
        >
          {planningApprovalSteps.map((step, idx) => (
            <Fieldset
              title={`Step ${idx + 1}: ${step.name}`}
              key={"planning_step_" + idx}
            >
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
                  {step.approvers.map((position, approverIdx) => (
                    <tr
                      key={`${step.uuid}_${position.uuid}`}
                      id={`planning_step_${idx}_approver_${approverIdx}`}
                    >
                      {position.person && position.person.uuid ? (
                        <td>
                          <LinkTo modelType="Person" model={position.person} />
                        </td>
                      ) : (
                        <td className="text-danger">Unfilled</td>
                      )}
                      <td>
                        <LinkTo modelType="Position" model={position} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Fieldset>
          ))}

          {planningApprovalSteps.length === 0 && (
            <em>
              This object doesn't have any engagement planning approval steps
            </em>
          )}
        </Fieldset>
      )}
      {approvalSteps && (
        <Fieldset id="approvals" title="Report publication approval process">
          {approvalSteps.map((step, idx) => (
            <Fieldset
              title={`Step ${idx + 1}: ${step.name}`}
              key={"approval_step_" + idx}
            >
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
                  {step.approvers.map((position, approverIdx) => (
                    <tr
                      key={`${step.uuid}_${position.uuid}`}
                      id={`approval_step_${idx}_approver_${approverIdx}`}
                    >
                      {position.person && position.person.uuid ? (
                        <td>
                          <LinkTo modelType="Person" model={position.person} />
                        </td>
                      ) : (
                        <td className="text-danger">Unfilled</td>
                      )}
                      <td>
                        <LinkTo modelType="Position" model={position} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Fieldset>
          ))}

          {approvalSteps.length === 0 && (
            <em>
              This object doesn't have any report publication approval steps
            </em>
          )}
        </Fieldset>
      )}
    </div>
  )
}

export default Approvals
