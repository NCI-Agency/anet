import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const ACTION_SIDES = {
  LEFT: "left",
  RIGHT: "right"
}

const AssociatedPositions = ({ associatedPositions, action, actionSide }) => {
  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          {action && actionSide === ACTION_SIDES.LEFT && <th>Action</th>}
          <th>Name</th>
          <th>Position</th>
          {action && actionSide === ACTION_SIDES.RIGHT && <th>Action</th>}
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
        {action && actionSide === ACTION_SIDES.LEFT && (
          <td>{action(pos, idx)}</td>
        )}
        <td>{personName}</td>
        <td>
          <LinkTo modelType="Position" model={pos} />
        </td>
        {action && actionSide === ACTION_SIDES.RIGHT && (
          <td>{action(pos, idx)}</td>
        )}
      </tr>
    )
  }
}

AssociatedPositions.propTypes = {
  associatedPositions: PropTypes.array,
  action: PropTypes.func,
  actionSide: PropTypes.oneOf(Object.values(ACTION_SIDES))
}

AssociatedPositions.defaultProps = {
  associatedPositions: [],
  actionSide: ACTION_SIDES.RIGHT
}

export default AssociatedPositions
