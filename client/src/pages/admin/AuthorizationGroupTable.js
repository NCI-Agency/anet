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
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Members</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {authorizationGroups.map(authorizationGroup => (
          <tr key={authorizationGroup.uuid}>
            <td>
              <LinkTo
                modelType="AuthorizationGroup"
                model={authorizationGroup}
              />
            </td>
            <td>{authorizationGroup.description}</td>
            <td>
              {authorizationGroup.authorizationGroupRelatedObjects.map(agro => (
                <div key={agro.relatedObjectUuid}>
                  <LinkTo
                    modelType={agro.relatedObjectType}
                    model={agro.relatedObject}
                  />
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
