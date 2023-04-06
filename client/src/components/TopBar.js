import { resetPages } from "actions"
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
import PropTypes from "prop-types"
import React, { useContext, useEffect, useRef, useState } from "react"
import { connect } from "react-redux"

const TopBar = ({
  handleTopbarHeight,
  resetPages,
  minimalHeader,
  toggleMenuAction,
  handleSecurityBannerBottom
}) => {
  const { appSettings, currentUser } = useContext(AppContext)
  const [bannerVisibility, setBannerVisibility] = useState(false)
  const [height, setHeight] = useState(0)
  const topbarDiv = useRef()

  const visibilitySetting = parseInt(appSettings[GENERAL_BANNER_VISIBILITY], 10)
  const bannerOptions = {
    level: appSettings[GENERAL_BANNER_LEVEL],
    message: appSettings[GENERAL_BANNER_TEXT],
    title: GENERAL_BANNER_TITLE,
    visible: bannerVisibility
  }

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
TopBar.propTypes = {
  handleTopbarHeight: PropTypes.func.isRequired,
  resetPages: PropTypes.func.isRequired,
  minimalHeader: PropTypes.bool,
  toggleMenuAction: PropTypes.func,
  handleSecurityBannerBottom: PropTypes.func.isRequired
}

const mapDispatchToProps = dispatch => ({
  resetPages: () => dispatch(resetPages())
})

export default connect(null, mapDispatchToProps)(TopBar)
