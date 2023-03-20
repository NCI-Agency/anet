import React from "react"

const css = {
  background: "orange"
}

const NoPositionBanner = () => (
  <div className="banner" style={css}>
    You haven't been assigned to an active position. Contact your organization's
    superuser to be added.
  </div>
)

export default NoPositionBanner
