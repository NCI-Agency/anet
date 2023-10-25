import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

function ApprovalSteps({ approvalSteps }) {
  return (
    <div style={{ display: "flex", flexFlow: "column" }}>
      {approvalSteps.map((step, idx) => renderApprovalSteps(step, idx))}
    </div>
  )

  function renderApprovalSteps(step, idx) {
    return (
      <div key={idx}>
        <h5>{step.name}</h5>
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Person</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {step.approvers.map((pos, idx) => {
              return (
                <tr key={pos.uuid}>
                  <td>
                    <LinkTo modelType="Person" model={pos.person} />
                  </td>
                  <td>
                    <LinkTo modelType="Position" model={pos} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>
    )
  }
}

ApprovalSteps.propTypes = {
  approvalSteps: PropTypes.array
}

ApprovalSteps.defaultProps = {
  approvalSteps: []
}

export default ApprovalSteps
