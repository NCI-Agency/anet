import LinkTo from "components/LinkTo"
import moment from "moment"
import React from "react"
import { Alert, Table } from "react-bootstrap"
import Settings from "settings"
import "./RecentActivityTable.css"

interface RecentActivityTableProps {
  text: string
  values?: any[]
}

const RecentActivityTable = ({ text, values }: RecentActivityTableProps) => {
  if (!values) {
    return (
      <Alert variant="info" style={{ textAlign: "center" }}>
        Click <b>Load Recent Activities & Recent Users</b> button to load {text}
        .
      </Alert>
    )
  }

  if (!values.length) {
    return (
      <Alert variant="warning" style={{ textAlign: "center" }}>
        No {text} detected!
      </Alert>
    )
  }

  return (
    <div className="recent-activities-table-container">
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
              <tr key={ua.listKey}>
                <td>{idx + 1}</td>
                <td className="nobr">
                  {moment(ua.activity.time).format(
                    Settings.dateFormats.forms.displayShort.withTime
                  )}
                </td>
                <td className="nobr">
                  <LinkTo modelType="Person" model={ua.user} />
                </td>
                <td>{ua.activity.ip}</td>
                <td>{ua.activity.request}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export default RecentActivityTable
