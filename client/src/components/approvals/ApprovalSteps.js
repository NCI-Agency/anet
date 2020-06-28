import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Checkbox, Table } from "react-bootstrap"

export const PLANNING_APPROVAL = {
  fsId: "planningApprovals",
  fsTitle: "Engagement planning approval process",
  noStepsMsg: "This object doesn't have any engagement planning approval steps"
}

export const PUBLICATION_APPROVAL = {
  fsId: "approvals",
  fsTitle: "Report publication approval process",
  noStepsMsg: "This object doesn't have any report publication approval steps"
}

const ApprovalSteps = ({
  type,
  steps,
  restrictedApprovalLabel,
  fieldSetAction
}) => {
  return (
    <Fieldset id={type.fsId} title={type.fsTitle} action={fieldSetAction}>
      {!steps?.length && <em>{type.noStepsMsg}</em>}
      {steps?.length > 0 &&
        steps.map((step, idx) => (
          <Fieldset title={`Step ${idx + 1}: ${step.name}`} key={"step_" + idx}>
            {restrictedApprovalLabel && (
              <Checkbox inline checked={step.restrictedApproval} readOnly>
                {restrictedApprovalLabel}
              </Checkbox>
            )}
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                </tr>
              </thead>

              <tbody>
                {step.approvers.map((position, approverIdx) => (
                  <tr
                    key={`${step.uuid}_${position.uuid}`}
                    id={`step_${idx}_approver_${approverIdx}`}
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
    </Fieldset>
  )
}

ApprovalSteps.propTypes = {
  type: PropTypes.oneOf([PLANNING_APPROVAL, PUBLICATION_APPROVAL]).isRequired,
  steps: PropTypes.arrayOf(PropTypes.object),
  restrictedApprovalLabel: PropTypes.string,
  fieldSetAction: PropTypes.node
}

export default ApprovalSteps
