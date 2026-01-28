import { ChatBridgeProvider, useChatBridge } from "components/chat/ChatBridge"
import ChatPanel from "components/chat/ChatPanel"
import Navigation from "components/Nav"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import TopBar from "components/TopBar"
import React, { useEffect, useState } from "react"
import LoadingBar from "react-redux-loading-bar"
import { useLocation } from "react-router-dom"
import { Element } from "react-scroll"
import Settings from "settings"

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
  sidebarData?: {
    allOrganizations?: any[]
  }
  children?: React.ReactNode
}

function TopBarWithChat(props) {
  const { toggle } = useChatBridge()
  return <TopBar {...props} toggleChatAction={toggle} />
}

const ResponsiveLayoutInner = ({
  pageProps,
  sidebarData,
  children
}: ResponsiveLayoutProps) => {
  const location = useLocation()
  const [floatingMenu, setFloatingMenu] = useState(false)
  const [topbarHeight, setTopbarHeight] = useState(0)
  const [securityBannerBottom, setSecurityBannerBottom] = useState(0)
  useEffect(() => {
    // We want to hide the floating menu on navigation events
    showFloatingMenu(false)
  }, [location])

  const sidebarClass = floatingMenu ? "nav-overlay" : "d-none d-sm-block"

  return (
    <ResponsiveLayoutContext.Provider
      value={{
        showFloatingMenu,
        topbarOffset: topbarHeight,
        securityBannerOffset: securityBannerBottom
      }}
    >
      <div style={anetContainer} className="anet">
        {Settings.chatAssistantUrl ? (
          <TopBarWithChat
            handleTopbarHeight={handleTopbarHeight}
            minimalHeader={pageProps.minimalHeader}
            handleSecurityBannerBottom={handleSecurityBannerBottom}
            toggleMenuAction={() => {
              showFloatingMenu(!floatingMenu)
            }}
          />
        ) : (
          <TopBar
            handleTopbarHeight={handleTopbarHeight}
            minimalHeader={pageProps.minimalHeader}
            handleSecurityBannerBottom={handleSecurityBannerBottom}
            toggleMenuAction={() => {
              showFloatingMenu(!floatingMenu)
            }}
          />
        )}
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
                <Navigation {...sidebarData} />
              </div>
            </div>
          )}
          <Element
            name="mainViewport"
            id="main-viewport"
            style={{ flex: "1 1 auto", overflow: "auto" }}
          >
            {children}
          </Element>
          {Settings.chatAssistantUrl && <ChatPanel />}
        </div>
      </div>
    </ResponsiveLayoutContext.Provider>
  )

  function handleTopbarHeight(topbarHeight) {
    setTopbarHeight(topbarHeight)
  }

  function handleSecurityBannerBottom(securityBannerBottom) {
    setSecurityBannerBottom(securityBannerBottom)
  }

  function showFloatingMenu(floatingMenu) {
    setFloatingMenu(floatingMenu)
  }
}

const ResponsiveLayout = (props: ResponsiveLayoutProps) => {
  return Settings.chatAssistantUrl ? (
    <ChatBridgeProvider>
      <ResponsiveLayoutInner {...props} />
    </ChatBridgeProvider>
  ) : (
    <ResponsiveLayoutInner {...props} />
  )
}

export default ResponsiveLayout
