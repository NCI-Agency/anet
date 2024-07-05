import LinkTo from "components/LinkTo"
import RemoveButton from "components/RemoveButton"
import _get from "lodash/get"
import { Organization } from "models"
import React from "react"
import { Table } from "react-bootstrap"

interface NoPaginationOrganizationTableProps {
  id?: string
  organizations?: any[]
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  noOrganizationsMessage?: string
}

const NoPaginationOrganizationTable = ({
  id,
  organizations,
  showDelete = false,
  onDelete,
  noOrganizationsMessage = "No organizations found"
}: NoPaginationOrganizationTableProps) => {
  const organizationExists = _get(organizations, "length", 0) > 0

  return (
    <div id={id}>
      {organizationExists ? (
        <Table striped hover responsive className="organization_table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Location</th>
              {showDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {Organization.map(organizations, organization => {
              return (
                <tr key={organization.uuid}>
                  <td>
                    <LinkTo modelType="Organization" model={organization} />
                  </td>
                  <td>{organization.description}</td>
                  <td>
                    <LinkTo
                      modelType="Location"
                      model={organization.location}
                      whenUnspecified=""
                    />
                  </td>
                  {showDelete && (
                    <td id={"organizationDelete_" + organization.uuid}>
                      <RemoveButton
                        title="Remove organization"
                        onClick={() => onDelete(organization)}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <em>{noOrganizationsMessage}</em>
      )}
    </div>
  )
}

export default NoPaginationOrganizationTable
