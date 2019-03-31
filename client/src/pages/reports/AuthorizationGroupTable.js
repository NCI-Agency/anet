import React from "react"
import { Table } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"

const AuthorizationGroupTable = props => (
  <Table striped condensed hover responsive>
    <thead>
      <tr>
        <th>Name</th>
        <th>Description</th>
        {props.showDelete && <th />}
      </tr>
    </thead>
    <tbody>
      {props.authorizationGroups.map((ag, agIndex) => (
        <tr key={ag.uuid}>
          <td>{ag.name}</td>
          <td>{ag.description}</td>
          {props.showDelete && (
            <td onClick={() => props.onDelete(ag)}>
              <span style={{ cursor: "pointer" }}>
                <img src={REMOVE_ICON} height={14} alt="Remove group" />
              </span>
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </Table>
)

export default AuthorizationGroupTable
