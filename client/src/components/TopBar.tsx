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
import PollingContext from "components/PollingContext"
import SecurityBanner from "components/SecurityBanner"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import { connect } from "react-redux"

function getRefHeight(ref: React.MutableRefObject<undefined>) {
  return ref?.current?.clientHeight
}

function getRefBottom(ref: React.MutableRefObject<undefined>) {
  return ref?.current?.getBoundingClientRect?.()?.bottom
}

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
  const { currentUser } = useContext(AppContext)
  const { appSettings } = useContext(PollingContext)
  const [bannerVisibility, setBannerVisibility] = useState(false)
  const [topbarHeight, setTopbarHeight] = useState(0)
  const topbarDiv = useRef()
  const [bannersOffset, setBannersOffset] = useState(0)
  const bannersDiv = useRef()

  const visibilitySetting = Number.parseInt(
    appSettings[GENERAL_BANNER_VISIBILITY],
    10
  )
  const bannerOptions = useMemo(
    () => ({
      level: appSettings[GENERAL_BANNER_LEVEL],
      message: appSettings[GENERAL_BANNER_TEXT],
      title: GENERAL_BANNER_TITLE,
      visible: bannerVisibility
    }),
    [appSettings, bannerVisibility]
  )

  // Needed as an effect dependency
  const currentHeight = getRefHeight(topbarDiv)
  useEffect(() => {
    function updateTopbarHeight() {
      // Must recompute here because of the window event listener
      const newHeight = getRefHeight(topbarDiv)
      if (newHeight !== undefined && newHeight !== topbarHeight) {
        setTopbarHeight(newHeight)
        handleTopbarHeight?.(newHeight)
      }
    }
    updateTopbarHeight()
    window.addEventListener("resize", updateTopbarHeight)
    // returned function will be called on component unmount
    return () => {
      window.removeEventListener("resize", updateTopbarHeight)
    }
  }, [
    topbarHeight,
    currentHeight,
    handleTopbarHeight,
    bannerOptions // if the bannerOptions change, we must recompute the height!
  ])

  // Needed as an effect dependency
  const currentBottom = getRefBottom(bannersDiv)
  useEffect(() => {
    function updateBannersBottom() {
      // Must recompute here because of the window event listener
      const newOffset = getRefBottom(bannersDiv)
      if (newOffset !== undefined && newOffset !== bannersOffset) {
        setBannersOffset(newOffset)
        handleSecurityBannerBottom?.(newOffset)
      }
    }
    updateBannersBottom()
    window.addEventListener("resize", updateBannersBottom)
    // returned function will be called on component unmount
    return () => {
      window.removeEventListener("resize", updateBannersBottom)
    }
  }, [
    currentBottom,
    bannersOffset,
    handleSecurityBannerBottom,
    bannerOptions // if the bannerOptions change, we must recompute the height!
  ])

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
        <div id="banners" ref={bannersDiv}>
          <GeneralBanner options={bannerOptions} />
          <SecurityBanner
            onLogout={resetPages}
            handleSecurityBannerBottom={handleSecurityBannerBottom}
          />
          {currentUser &&
            !currentUser.hasActivePosition() &&
            !currentUser.isPendingVerification() && <NoPositionBanner />}
        </div>
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
