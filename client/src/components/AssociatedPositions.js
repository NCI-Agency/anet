import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const AssociatedPositions = ({ associatedPositions, action, actionSide }) => {
  return (
    <Table>
      <thead>
        <tr>
          {action && actionSide === "left" && <th>Action</th>}
          <th>Name</th>
          <th>Position</th>
          {action && actionSide === "right" && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {associatedPositions.map((pos, idx) =>
          renderAssociatedPositionRow(pos, idx)
        )}
      </tbody>
    </Table>
  )

  function renderAssociatedPositionRow(pos, idx) {
    let personName
    if (!pos.person) {
      personName = "Unfilled"
    } else {
      personName = <LinkTo modelType="Person" model={pos.person} />
    }
    return (
      <tr key={pos.uuid} id={`associatedPosition_${idx}`}>
        {action && actionSide === "left" && <td>{action(pos, idx)}</td>}
        <td>{personName}</td>
        <td>
          <LinkTo modelType="Position" model={pos} />
        </td>
        {action && actionSide === "right" && <td>{action(pos, idx)}</td>}
      </tr>
    )
  }
}

AssociatedPositions.propTypes = {
  associatedPositions: PropTypes.array,
  action: PropTypes.func,
  actionSide: PropTypes.string
}

AssociatedPositions.defaultProps = {
  associatedPositions: [],
  actionSide: "right"
}

export default AssociatedPositions
