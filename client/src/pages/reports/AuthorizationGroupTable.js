import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"

const AuthorizationGroupTable = props => {
  const { authorizationGroups, showDelete, onDelete } = props
  return (
    <Table striped condensed hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          {showDelete && <th />}
        </tr>
      </thead>
      <tbody>
        {authorizationGroups.map((ag, agIndex) => (
          <tr key={ag.uuid}>
            <td>{ag.name}</td>
            <td>{ag.description}</td>
            {showDelete && (
              <td onClick={() => onDelete(ag)}>
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
}
AuthorizationGroupTable.propTypes = {
  authorizationGroups: PropTypes.array.isRequired,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func
}

export default AuthorizationGroupTable
