import PropTypes from "prop-types"
import React from "react"

export const GENERAL_BANNER_LEVELS = {
  NOTICE: { value: "notice", className: "alert-info", label: "Blue" },
  SUCCESS: { value: "success", className: "alert-success", label: "Green" },
  ERROR: { value: "error", className: "alert-danger", label: "Red" },
  ALERT: { value: "alert", className: "alert-warning", label: "Yellow" }
}

function bannerClassName(level) {
  let output = "general-banner "
  switch (level) {
    case GENERAL_BANNER_LEVELS.NOTICE.value:
      return (output += ` ${GENERAL_BANNER_LEVELS.NOTICE.className}`)
    case GENERAL_BANNER_LEVELS.SUCCESS.value:
      return (output += ` ${GENERAL_BANNER_LEVELS.SUCCESS.className}`)
    case GENERAL_BANNER_LEVELS.ERROR.value:
      return (output += ` ${GENERAL_BANNER_LEVELS.ERROR.className}`)
    case GENERAL_BANNER_LEVELS.ALERT.value:
      return (output += ` ${GENERAL_BANNER_LEVELS.ALERT.className}`)
    default:
      return output
  }
}

const GeneralBanner = props => {
  const banner = props.options
  if (banner.visible && banner.message) {
    return (
      <div className={bannerClassName(banner.level)}>
        <div className="message">
          <strong>{banner.title}:</strong> {banner.message}
        </div>
      </div>
    )
  } else {
    return null
  }
}

GeneralBanner.propTypes = {
  options: PropTypes.object
}

export default GeneralBanner
