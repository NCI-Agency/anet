import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const OrganizationsAdministrated = ({ organizations }) => {
  return (
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>UIC</th>
        </tr>
      </thead>
      <tbody>
        {organizations.map(org => (
          <tr key={org.uuid}>
            <td>
              <LinkTo modelType="Organization" model={org} />
            </td>
            <td>{org.identificationCode}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

OrganizationsAdministrated.propTypes = {
  organizations: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default OrganizationsAdministrated
