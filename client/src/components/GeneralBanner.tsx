import React from "react"

export const GENERAL_BANNER_LEVEL = "GENERAL_BANNER_LEVEL"
export const GENERAL_BANNER_TEXT = "GENERAL_BANNER_TEXT"
export const GENERAL_BANNER_VISIBILITY = "GENERAL_BANNER_VISIBILITY"
export const GENERAL_BANNER_TITLE = "Announcement"

export const GENERAL_BANNER_LEVELS = {
  NOTICE: { value: "notice", className: "alert-info", label: "Blue" },
  SUCCESS: { value: "success", className: "alert-success", label: "Green" },
  ERROR: { value: "error", className: "alert-danger", label: "Red" },
  ALERT: { value: "alert", className: "alert-warning", label: "Yellow" }
}

export const GENERAL_BANNER_VISIBILITIES = {
  USERS_ONLY: { value: 1, label: "Users only" },
  SUPERUSERS_AND_ADMINISTRATORS: {
    value: 2,
    label: "Superusers and administrators only"
  },
  ALL: { value: 3, label: "Users, superusers and administrators" }
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

interface GeneralBannerProps {
  options?: any
}

const GeneralBanner = (props: GeneralBannerProps) => {
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

export default GeneralBanner
