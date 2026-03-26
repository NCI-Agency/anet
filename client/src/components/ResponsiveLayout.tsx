import AppContext from "components/AppContext"
import Navigation from "components/Nav"
import PollingContext from "components/PollingContext"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import TopBar from "components/TopBar"
import { usePollingRequest } from "pollingUtils"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { connect } from "react-redux"
import LoadingBar from "react-redux-loading-bar"
import { Navigate, Outlet, useLocation } from "react-router"
import { Element } from "react-scroll"

const anetContainer = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "auto"
}
const contentContainer = {
  flex: "1 1 auto",
  display: "flex",
  flexDirection: "row",
  minWidth: 0,
  minHeight: 0,
  overflow: "hidden"
}

const sidebarContainer = {
  position: "relative",
  flex: "0 0 auto",
  overflowY: "auto",
  overflowX: "hidden",
  msOverflowStyle: "-ms-autohiding-scrollbar",
  fontSize: 15,
  paddingRight: 0,
  paddingLeft: 15,
  paddingBottom: 5
}
const sidebar = {
  flexGrow: 1,
  minWidth: 200,
  paddingTop: 25
}
const glassPane = {
  position: "absolute",
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  width: "100%",
  height: "100vh",
  marginTop: -5,
  left: 0,
  zIndex: 99
}
const loadingBar = {
  backgroundColor: "#29d"
}

interface ResponsiveLayoutProps {
  pageProps: {
    minimalHeader?: boolean
    useNavigation?: boolean
  }
}

const ResponsiveLayout = ({ pageProps }: ResponsiveLayoutProps) => {
  const location = useLocation()
  const { adminSettings, ...connectionInfo } = usePollingRequest()
  const { allOrganizations, currentUser } = useContext(AppContext)
  const [floatingMenu, setFloatingMenu] = useState(false)
  const [topbarHeight, setTopbarHeight] = useState(0)
  const [securityBannerBottom, setSecurityBannerBottom] = useState(0)
  useEffect(() => {
    // We want to hide the floating menu on navigation events
    setFloatingMenu(false)
  }, [location])
  const layoutContext = useMemo(
    () => ({
      showFloatingMenu: setFloatingMenu,
      topbarOffset: topbarHeight,
      securityBannerOffset: securityBannerBottom
    }),
    [securityBannerBottom, topbarHeight]
  )
  const pollingContext = useMemo(
    () => ({
      appSettings: adminSettings,
      connection: { ...connectionInfo }
    }),
    [adminSettings, connectionInfo]
  )

  const sidebarClass = floatingMenu ? "nav-overlay" : "d-none d-sm-block"

  // if this is a new user, redirect to onboarding
  if (
    currentUser.isPendingVerification() &&
    !location.pathname.startsWith("/onboarding")
  ) {
    return (
      <Navigate replace to="/onboarding/new" state={{ nextUrl: location }} />
    )
  }

  return (
    <ResponsiveLayoutContext.Provider value={layoutContext}>
      <PollingContext.Provider value={pollingContext}>
        <div style={anetContainer} className="anet">
          <TopBar
            handleTopbarHeight={handleTopbarHeight}
            minimalHeader={pageProps.minimalHeader}
            handleSecurityBannerBottom={handleSecurityBannerBottom}
            toggleMenuAction={() => {
              setFloatingMenu(!floatingMenu)
            }}
          />
          <div style={contentContainer} className="content-container">
            <LoadingBar showFastActions style={loadingBar} />
            <div
              style={floatingMenu ? glassPane : null}
              onClick={() => {
                setFloatingMenu(false)
              }}
            />
            {(pageProps.useNavigation || floatingMenu) && (
              <div
                style={sidebarContainer}
                className={`main-sidebar ${sidebarClass}`}
              >
                <div style={sidebar}>
                  <Navigation allOrganizations={allOrganizations} />
                </div>
              </div>
            )}
            <Element name="mainViewport" id="main-viewport">
              <Outlet />
            </Element>
          </div>
        </div>
      </PollingContext.Provider>
    </ResponsiveLayoutContext.Provider>
  )

  function handleTopbarHeight(topbarHeight) {
    setTopbarHeight(topbarHeight)
  }

  function handleSecurityBannerBottom(securityBannerBottom) {
    setSecurityBannerBottom(securityBannerBottom)
  }
}

const mapStateToProps = state => ({
  pageProps: state.pageProps
})

export default connect(mapStateToProps)(ResponsiveLayout)
