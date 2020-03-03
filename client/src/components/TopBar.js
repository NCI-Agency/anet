import { resetPages } from "actions"
import AppContext from "components/AppContext"
import GeneralBanner from "components/GeneralBanner"
import Header from "components/Header"
import NoPositionBanner from "components/NoPositionBanner"
import SecurityBanner from "components/SecurityBanner"
import { Person } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { connect } from "react-redux"

const GENERAL_BANNER_LEVEL = "GENERAL_BANNER_LEVEL"
const GENERAL_BANNER_TEXT = "GENERAL_BANNER_TEXT"
const GENERAL_BANNER_VISIBILITY = "GENERAL_BANNER_VISIBILITY"
const GENERAL_BANNER_TITLE = "Announcement"
const visible = {
  USERS: 1,
  SUPER_USERS: 2,
  USERS_AND_SUPER_USERS: 3
}

const BaseTopBar = ({
  currentUser,
  appSettings,
  handleTopbarHeight,
  resetPages,
  minimalHeader,
  toggleMenuAction
}) => {
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
    let output = false
    if (
      visibilitySetting === visible.USERS &&
      currentUser &&
      !currentUser.isSuperUser()
    ) {
      output = true
    }
    if (
      visibilitySetting === visible.SUPER_USERS &&
      currentUser &&
      currentUser.isSuperUser()
    ) {
      output = true
    }
    if (
      visibilitySetting === visible.USERS_AND_SUPER_USERS &&
      (currentUser || currentUser.isSuperUser())
    ) {
      output = true
    }
    if (bannerVisibility !== output) {
      setBannerVisibility(output)
    }
  }, [bannerVisibility, currentUser, visibilitySetting])

  return (
    <div style={{ flex: "0 0 auto", zIndex: 1100 }} ref={topbarDiv}>
      <div id="topbar">
        <GeneralBanner options={bannerOptions} />
        <SecurityBanner />
        {currentUser &&
          !currentUser.hasActivePosition() &&
          !currentUser.isNewUser() && <NoPositionBanner />}
        <Header
          minimalHeader={minimalHeader}
          toggleMenuAction={toggleMenuAction}
          onHomeClick={resetPages}
        />
      </div>
    </div>
  )
}
BaseTopBar.propTypes = {
  currentUser: PropTypes.instanceOf(Person),
  appSettings: PropTypes.object,
  handleTopbarHeight: PropTypes.func.isRequired,
  resetPages: PropTypes.func.isRequired,
  minimalHeader: PropTypes.bool,
  toggleMenuAction: PropTypes.func
}

const TopBar = props => (
  <AppContext.Consumer>
    {context => (
      <BaseTopBar
        appSettings={context.appSettings}
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

const mapDispatchToProps = dispatch => ({
  resetPages: () => dispatch(resetPages())
})

export default connect(null, mapDispatchToProps)(TopBar)
