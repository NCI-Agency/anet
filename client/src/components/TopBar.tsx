import { gql } from "@apollo/client"
import { resetPages } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import GeneralBanner, {
  GENERAL_BANNER_LEVEL,
  GENERAL_BANNER_TEXT,
  GENERAL_BANNER_TITLE,
  GENERAL_BANNER_VISIBILITIES,
  GENERAL_BANNER_VISIBILITY
} from "components/GeneralBanner"
import Header from "components/Header"
import NoPositionBanner from "components/NoPositionBanner"
import SecurityBanner from "components/SecurityBanner"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import { connect } from "react-redux"

const POLLING_INTERVAL = 60_000 // milliseconds

const GQL_GET_ADMIN_SETTINGS = gql`
  query TopBarAdminSettings {
    adminSettings {
      key
      value
    }
  }
`

interface TopBarProps {
  handleTopbarHeight: (...args: unknown[]) => unknown
  resetPages: (...args: unknown[]) => unknown
  minimalHeader?: boolean
  toggleMenuAction?: (...args: unknown[]) => unknown
  handleSecurityBannerBottom: (...args: unknown[]) => unknown
}

const TopBar = ({
  handleTopbarHeight,
  resetPages,
  minimalHeader,
  toggleMenuAction,
  handleSecurityBannerBottom
}: TopBarProps) => {
  const { appSettings, currentUser } = useContext(AppContext)
  const [bannerVisibility, setBannerVisibility] = useState(false)
  const [height, setHeight] = useState(0)
  const topbarDiv = useRef()

  const {
    data: adminData,
    startPolling,
    stopPolling
  } = API.useApiQuery(GQL_GET_ADMIN_SETTINGS)

  useEffect(() => {
    startPolling?.(POLLING_INTERVAL)
    return () => stopPolling?.()
  }, [startPolling, stopPolling])

  const polledSettings = useMemo(() => {
    const list = adminData?.adminSettings || []
    if (!list.length) {
      return undefined
    }
    const output = {}
    for (const setting of list) {
      output[setting.key] = setting.value
    }
    return output
  }, [adminData])

  const effectiveSettings = polledSettings || appSettings
  const visibilitySetting = parseInt(
    effectiveSettings[GENERAL_BANNER_VISIBILITY],
    10
  )
  const bannerOptions = useMemo(
    () => ({
      level: effectiveSettings[GENERAL_BANNER_LEVEL],
      message: effectiveSettings[GENERAL_BANNER_TEXT],
      title: GENERAL_BANNER_TITLE,
      visible: bannerVisibility
    }),
    [
      effectiveSettings[GENERAL_BANNER_LEVEL],
      effectiveSettings[GENERAL_BANNER_TEXT],
      bannerVisibility
    ]
  )

  useEffect(() => {
    function updateTopbarHeight() {
      const curHeight = topbarDiv.current.clientHeight
      if (curHeight !== undefined && curHeight !== height) {
        setHeight(curHeight)
      }
    }
    updateTopbarHeight()
    window.addEventListener("resize", updateTopbarHeight)
    // returned function will be called on component unmount
    return () => {
      window.removeEventListener("resize", updateTopbarHeight)
    }
  }, [currentUser, height])

  useEffect(() => {
    handleTopbarHeight(height)
  }, [height, handleTopbarHeight])

  useEffect(() => {
    const output =
      currentUser &&
      ((visibilitySetting === GENERAL_BANNER_VISIBILITIES.USERS_ONLY.value &&
        !currentUser.isSuperuser()) ||
        (visibilitySetting ===
          GENERAL_BANNER_VISIBILITIES.SUPERUSERS_AND_ADMINISTRATORS.value &&
          currentUser.isSuperuser()) ||
        visibilitySetting === GENERAL_BANNER_VISIBILITIES.ALL.value)
    if (bannerVisibility !== output) {
      setBannerVisibility(output)
    }
  }, [bannerVisibility, currentUser, visibilitySetting])

  return (
    <div style={{ flex: "0 0 auto" }} className="d-print-none" ref={topbarDiv}>
      <div id="topbar">
        <GeneralBanner options={bannerOptions} />
        <SecurityBanner
          onLogout={resetPages}
          handleSecurityBannerBottom={handleSecurityBannerBottom}
        />
        {currentUser &&
          !currentUser.hasActivePosition() &&
          !currentUser.isPendingVerification() && <NoPositionBanner />}
        <Header
          minimalHeader={minimalHeader}
          toggleMenuAction={toggleMenuAction}
          onHomeClick={resetPages}
        />
      </div>
    </div>
  )
}

const mapDispatchToProps = dispatch => ({
  resetPages: () => dispatch(resetPages())
})

export default connect(null, mapDispatchToProps)(TopBar)
