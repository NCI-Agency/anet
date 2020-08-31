import RemoveButton from "components/RemoveButton"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const AuthorizationGroupTable = ({
  authorizationGroups,
  showDelete,
  onDelete
}) => (
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
            <td>
              <RemoveButton
                title="Remove group"
                altText="Remove group"
                onClick={() => onDelete(ag)}
              />
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </Table>
)
AuthorizationGroupTable.propTypes = {
  authorizationGroups: PropTypes.array.isRequired,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func
}

export default AuthorizationGroupTable
