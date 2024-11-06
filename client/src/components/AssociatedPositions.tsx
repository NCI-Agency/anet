import LinkTo from "components/LinkTo"
import _isEmpty from "lodash/isEmpty"
import React from "react"
import { Table } from "react-bootstrap"

const ACTION_SIDES = {
  LEFT: "left",
  RIGHT: "right"
}

const actionSides: string[] = Object.values(ACTION_SIDES)
interface AssociatedPositionsProps {
  associatedPositions?: any[]
  action?: (...args: unknown[]) => unknown
  actionSide?: (typeof actionSides)[number]
}

const AssociatedPositions = ({
  associatedPositions,
  action,
  actionSide
}: AssociatedPositionsProps) => {
  return _isEmpty(associatedPositions) ? (
    <em>No positions found</em>
  ) : (
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

AssociatedPositions.defaultProps = {
  associatedPositions: [],
  actionSide: ACTION_SIDES.RIGHT
}

export default AssociatedPositions
