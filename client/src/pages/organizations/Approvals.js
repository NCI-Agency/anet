import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { Organization } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const OrganizationApprovals = props => {
  const { organization } = props
  const approvalSteps = organization.approvalSteps

  return (
    <Fieldset id="approvals" title="Approval process">
      {approvalSteps.map((step, idx) => (
        <Fieldset title={`Step ${idx + 1}: ${step.name}`} key={"step_" + idx}>
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
                  key={position.uuid}
                  id={`step_${idx}_approver_${approverIdx}`}
                >
                  {position.person && position.person.uuid ? (
                    <td>{<LinkTo person={position.person} />}</td>
                  ) : (
                    <td className="text-danger">Unfilled</td>
                  )}
                  <td>
                    <LinkTo position={position} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Fieldset>
      ))}

      {approvalSteps.length === 0 && (
        <em>This organization doesn't have any approval steps</em>
      )}
    </Fieldset>
  )
}

OrganizationApprovals.propTypes = {
  organization: PropTypes.instanceOf(Organization).isRequired
}

export default OrganizationApprovals
