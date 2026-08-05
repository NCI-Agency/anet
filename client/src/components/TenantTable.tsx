import LinkTo from "components/LinkTo"
import Model from "components/Model"
import RemoveButton from "components/RemoveButton"
import _get from "lodash/get"
import React from "react"
import { Badge, Table } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

interface TenantTableProps {
  id?: string
  tenants?: any[]
  showLink?: boolean
  showStatus?: boolean
  showAccessRequestsCount?: boolean
  showMembersCount?: boolean
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  noTenantsMessage?: React.ReactNode
}

const TenantTable = ({
  id,
  tenants,
  showLink = false,
  showStatus = false,
  showAccessRequestsCount = false,
  showMembersCount = false,
  showDelete = false,
  onDelete,
  noTenantsMessage = "No tenants found"
}: TenantTableProps) => {
  const tenantsExist = _get(tenants, "length", 0) > 0

  return (
    <div id={id}>
      {tenantsExist ? (
        <Table striped hover responsive className="tasks_table">
          <thead>
            <tr>
              <th>{Settings.fields.tenant.name?.label}</th>
              {showStatus && <th>{Settings.fields.tenant.status?.label}</th>}
              {showAccessRequestsCount && <th># Access requests</th>}
              {showMembersCount && <th># Members</th>}
              {showDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => {
              const nrTenants = tenant.members?.length ?? 0
              const nrActiveTenants =
                tenant.members?.filter(m => m?.status === Model.STATUS.ACTIVE)
                  ?.length ?? 0
              const nrAccessRequests = tenant.accessRequests?.length ?? 0
              return (
                <tr key={tenant.uuid}>
                  <td>
                    {showLink ? (
                      <LinkTo
                        modelType="Tenant"
                        model={tenant}
                        showPreview={false}
                      />
                    ) : (
                      tenant.name
                    )}
                  </td>
                  {showStatus && <td>{utils.sentenceCase(tenant.status)}</td>}
                  {showAccessRequestsCount && (
                    <td>
                      {nrAccessRequests ? (
                        <Badge>{nrAccessRequests}</Badge>
                      ) : (
                        nrAccessRequests
                      )}
                    </td>
                  )}
                  {showMembersCount && (
                    <td>
                      {nrTenants}
                      {nrTenants !== nrActiveTenants &&
                        ` (active: ${nrActiveTenants})`}
                    </td>
                  )}
                  {showDelete && (
                    <td id={"tenantDelete_" + tenant.uuid}>
                      <RemoveButton
                        title="Remove tenant"
                        onClick={() => onDelete(tenant)}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <em>{noTenantsMessage}</em>
      )}
    </div>
  )
}

export default TenantTable
