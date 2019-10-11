import LinkTo from "components/LinkTo"
import { AuthorizationGroup } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const AuthorizationGroupTable = props => {
  const authorizationGroups = AuthorizationGroup.fromArray(
    props.authorizationGroups
  )

  return (
    <Table striped condensed hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Positions</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {authorizationGroups.map(authorizationGroup => (
          <tr key={authorizationGroup.uuid}>
            <td><LinkTo authorizationGroup={authorizationGroup} /></td>
            <td>{authorizationGroup.description}</td>
            <td>
              {authorizationGroup.positions.map(position => (
                <div key={position.uuid}>
                  <LinkTo position={position} />
                </div>
              ))}
            </td>
            <td>{authorizationGroup.humanNameOfStatus()} </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

AuthorizationGroupTable.propTypes = {
  authorizationGroups: PropTypes.array.isRequired
}

export default AuthorizationGroupTable
