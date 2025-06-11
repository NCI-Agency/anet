import _get from "lodash/get"
import React from "react"
import { Table } from "react-bootstrap"
import utils from "utils"

interface UserTableProps {
  label: string
  users?: any[]
}

const UserTable = ({ label, users }: UserTableProps) => {
  if (_get(users, "length", 0) === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }

  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Domain username</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.uuid}>
            <td>{u.domainUsername}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default UserTable
