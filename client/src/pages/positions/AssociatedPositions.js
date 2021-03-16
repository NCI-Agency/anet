import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

function AssociatedPositions({ associatedPositions }) {
  return (
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Position</th>
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
        <td>{personName}</td>
        <td>
          <LinkTo modelType="Position" model={pos} />
        </td>
      </tr>
    )
  }
}

AssociatedPositions.propTypes = {
  associatedPositions: PropTypes.array
}

export default AssociatedPositions
