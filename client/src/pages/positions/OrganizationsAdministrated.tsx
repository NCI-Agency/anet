import LinkTo from "components/LinkTo"
import React from "react"
import { Table } from "react-bootstrap"

interface OrganizationsAdministratedProps {
  organizations: any[]
}

const OrganizationsAdministrated = ({
  organizations
}: OrganizationsAdministratedProps) => {
  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {organizations.map(org => (
          <tr key={org.uuid}>
            <td>
              <LinkTo modelType="Organization" model={org} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default OrganizationsAdministrated
