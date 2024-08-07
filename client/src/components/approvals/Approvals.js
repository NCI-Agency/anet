import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { Location, Organization, Task } from "models"
import PropTypes from "prop-types"
import React from "react"
import { FormCheck, Table } from "react-bootstrap"

const Approvals = ({ restrictedApprovalLabel, relatedObject }) => {
  const approvalSteps = relatedObject.approvalSteps
  const planningApprovalSteps = relatedObject.planningApprovalSteps

  return (
    <div>
      <Fieldset
        id="planningApprovals"
        title="Engagement planning approval process"
      >
        {planningApprovalSteps.map((step, idx) => (
          <Fieldset title={`Step ${idx + 1}: ${step.name}`} key={"step_" + idx}>
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

        {planningApprovalSteps.length === 0 && (
          <em>
            This object doesn't have any engagement planning approval steps
          </em>
        )}
      </Fieldset>
      <Fieldset id="approvals" title="Report publication approval process">
        {approvalSteps.map((step, idx) => (
          <Fieldset title={`Step ${idx + 1}: ${step.name}`} key={"step_" + idx}>
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

        {approvalSteps.length === 0 && (
          <em>
            This object doesn't have any report publication approval steps
          </em>
        )}
      </Fieldset>
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
