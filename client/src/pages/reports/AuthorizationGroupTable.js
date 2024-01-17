import LinkTo from "components/LinkTo"
import RemoveButton from "components/RemoveButton"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

const AuthorizationGroupTable = ({
  authorizationGroups,
  showDelete,
  onDelete
}) => (
  <Table striped hover responsive>
    <thead>
      <tr>
        <th>{Settings.fields.authorizationGroup.name?.label}</th>
        <th>{Settings.fields.authorizationGroup.description?.label}</th>
        {showDelete && <th />}
      </tr>
    </thead>
    <tbody>
      {authorizationGroups.map((ag, agIndex) => (
        <tr key={ag.uuid}>
          <td>
            <LinkTo model={ag} modelType="AuthorizationGroup" />
          </td>
          <td>{ag.description}</td>
          {showDelete && (
            <td>
              <RemoveButton title="Remove group" onClick={() => onDelete(ag)} />
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
