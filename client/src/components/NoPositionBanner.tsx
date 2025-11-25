import React from "react"
import utils from "utils"

const WARNING_COLOR = "orange"
const css = {
  background: WARNING_COLOR,
  color: `${utils.getContrastYIQ(WARNING_COLOR)}`
}

const NoPositionBanner = () => (
  <div className="banner" style={css}>
    You do not have a primary position assigned. Please contact your
    organization's superuser(s) to be assigned to one.
  </div>
)

export default NoPositionBanner
