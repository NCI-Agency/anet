import PropTypes from "prop-types"
import React from "react"
import { Alert, Table } from "react-bootstrap"
import "./UserActivityTable.css"

const UserActivityTable = ({ text, values }) => {
  if (!values) {
    return (
      <Alert bsStyle="info" style={{ textAlign: "center" }}>
        Click <b>Load User Activities & Recent Users</b> button to load {text}.
      </Alert>
    )
  }

  if (!values.length) {
    return (
      <Alert bsStyle="warning" style={{ textAlign: "center" }}>
        No {text} detected!
      </Alert>
    )
  }

  return (
    <div className="user-activities-table-container">
      <Table striped hover size="sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Time</th>
            <th>User</th>
            <th>IP</th>
            <th>Request</th>
          </tr>
        </thead>
        <tbody>
          {values.map((ua, idx) => {
            return (
              <tr key={ua.uuid}>
                <td>{idx + 1}</td>
                <td className="nobr">{ua.time}</td>
                <td className="nobr">{ua.user}</td>
                <td>{ua.ip}</td>
                <td>{ua.request}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

UserActivityTable.propTypes = {
  text: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.object)
}

export default UserActivityTable
