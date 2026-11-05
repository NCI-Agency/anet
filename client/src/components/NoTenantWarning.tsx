import Model from "components/Model"
import React from "react"

interface NoTenantWarningProps {
  person: any
}

const NoTenantWarning = ({ person }: NoTenantWarningProps) => {
  const showNoTenantWarning =
    person?.status === Model.STATUS.ACTIVE &&
    person?.user &&
    person?.tenant?.status !== Model.STATUS.ACTIVE
  return (
    showNoTenantWarning && (
      <div id="no-tenant-warning" className="p-1 text-bg-danger text-center">
        This active user has not yet been assigned to an active Tenant
      </div>
    )
  )
}

export default NoTenantWarning
