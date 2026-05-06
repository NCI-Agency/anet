import React from "react"
import utils from "utils"

const DANGER_COLOR = "red"
const css = {
  background: DANGER_COLOR,
  color: `${utils.getContrastYIQ(DANGER_COLOR)}`
}

const NoTenantBanner = () => (
  <div className="banner" style={css}>
    You have not been assigned to a Tenant. Please contact your administrator to
    be assigned to one.
  </div>
)

export default NoTenantBanner
