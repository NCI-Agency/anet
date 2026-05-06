import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import React from "react"
import utils from "utils"

const DANGER_COLOR = "red"
const css = {
  background: DANGER_COLOR,
  color: `${utils.getContrastYIQ(DANGER_COLOR)}`
}

interface NoTenantBannerProps {
  person: any
}

const NoTenantBanner = ({ person }: NoTenantBannerProps) => {
  const showNoTenantBanner =
    !person?.pendingVerification &&
    person?.status === Model.STATUS.ACTIVE &&
    person?.user &&
    _isEmpty(person?.tenants?.filter(t => t?.status === Model.STATUS.ACTIVE))
  return (
    showNoTenantBanner && (
      <div className="banner" style={css}>
        You have not been assigned to an active Tenant. Please contact your
        administrator to be assigned to one.
      </div>
    )
  )
}

export default NoTenantBanner
