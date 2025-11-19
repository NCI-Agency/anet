import LinkTo from "components/LinkTo"
import _get from "lodash/get"
import React from "react"
import { Table } from "react-bootstrap"

interface PositionsTableProps {
  label: string
  positions?: any[]
}

function makePositionPrimary(b: boolean) {}

const PositionsTable = ({ label, positions }: PositionsTableProps) => {
  if (_get(positions, "length", 0) === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }

  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {positions.map(pos => (
          <tr key={pos.uuid}>
            <td>
              <LinkTo modelType="positions" model={pos} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default PositionsTable
