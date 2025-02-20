import React from "react"
import utils from "utils"

const WARNING_COLOR = "orange"
const css = {
  background: WARNING_COLOR,
  color: `${utils.getContrastYIQ(WARNING_COLOR)}`
}

const NoPositionBanner = () => (
  <div className="banner" style={css}>
    You haven't been assigned to an active position. Contact your organization's
    superuser to be added.
  </div>
)

export default NoPositionBanner
