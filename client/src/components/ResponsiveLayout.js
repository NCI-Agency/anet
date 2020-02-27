import Nav from "components/Nav"
import TopBar from "components/TopBar"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import LoadingBar from "react-redux-loading-bar"
import { useHistory } from "react-router-dom"
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
const mainViewportContainer = {
  flex: "1 1 auto",
  width: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  paddingTop: 15,
  paddingLeft: 18,
  paddingRight: 18
}
const notesViewportContainer = {
  paddingTop: 18,
  maxWidth: "35%",
  overflowY: "auto"
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

export const ResponsiveLayoutContext = React.createContext()

const ResponsiveLayout = ({ pageProps, sidebarData, children }) => {
  const history = useHistory()
  const [floatingMenu, setFloatingMenu] = useState(false)
  const [topbarHeight, setTopbarHeight] = useState(0)
  useEffect(() => {
    // We want to hide the floating menu on navigation events
    const unlistenHistory = history.listen((location, action) => {
      showFloatingMenu(false)
    })

    return () => unlistenHistory()
  }, [history])

  const sidebarClass = floatingMenu ? "nav-overlay" : "hidden-xs"

  return (
    <ResponsiveLayoutContext.Provider
      value={{
        showFloatingMenu: showFloatingMenu,
        topbarOffset: topbarHeight
      }}
    >
      <div style={anetContainer} className="anet">
        <TopBar
          handleTopbarHeight={handleTopbarHeight}
          minimalHeader={pageProps.minimalHeader}
          toggleMenuAction={() => {
            showFloatingMenu(!floatingMenu)
          }}
        />
        <div style={contentContainer} className="content-container">
          <LoadingBar showFastActions style={loadingBar} />
          <div
            style={floatingMenu ? glassPane : null}
            onClick={() => {
              showFloatingMenu(false)
            }}
          />
          {(pageProps.useNavigation || floatingMenu) && (
            <div
              style={sidebarContainer}
              className={`main-sidebar ${sidebarClass}`}
            >
              <div style={sidebar}>
                <Nav organizations={sidebarData} />
              </div>
            </div>
          )}
          <Element
            style={mainViewportContainer}
            name="mainViewport"
            id="main-viewport"
          >
            {children}
          </Element>
          <Element
            style={notesViewportContainer}
            name="notesView"
            id="notes-view"
          />
        </div>
      </div>
    </ResponsiveLayoutContext.Provider>
  )

  function handleTopbarHeight(topbarHeight) {
    setTopbarHeight(topbarHeight)
  }

  function showFloatingMenu(floatingMenu) {
    setFloatingMenu(floatingMenu)
  }
}

ResponsiveLayout.propTypes = {
  pageProps: PropTypes.shape({
    minimalHeader: PropTypes.bool,
    useNavigation: PropTypes.bool
  }).isRequired,
  sidebarData: PropTypes.array,
  children: PropTypes.node
}

export default ResponsiveLayout
