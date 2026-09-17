import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import React from "react"

interface NoTenantWarningProps {
  person: any
}

const NoTenantWarning = ({ person }: NoTenantWarningProps) => {
  const showNoTenantWarning =
    person?.status === Model.STATUS.ACTIVE &&
    person?.user &&
    _isEmpty(person?.tenants?.filter(t => t?.status === Model.STATUS.ACTIVE))
  return (
    showNoTenantWarning && (
      <div id="no-tenant-warning" className="p-1 text-bg-danger text-center">
        This active user has not yet been assigned to any active Tenant
      </div>
    )
  )
}

export default NoTenantWarning
