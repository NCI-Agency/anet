import Nav from "components/Nav"
import TopBar from "components/TopBar"
import PropTypes from "prop-types"
import React, { Component } from "react"
import LoadingBar from "react-redux-loading-bar"
import { withRouter } from "react-router-dom"
import { Element } from "react-scroll"

const anetContainer = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "hidden"
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
  maxWidth: "33%",
  overflow: "auto"
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

class ResponsiveLayout extends Component {
  static propTypes = {
    pageProps: PropTypes.shape({
      minimalHeader: PropTypes.bool
    }).isRequired,
    pageHistory: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    sidebarData: PropTypes.array,
    children: PropTypes.node
  }

  constructor(props) {
    super(props)

    this.state = {
      floatingMenu: false,
      topbarHeight: 0
    }
  }

  componentDidMount() {
    // We want to hide the floating menu on navigation events
    this.unlistenHistory = this.props.pageHistory.listen((location, action) => {
      this.showFloatingMenu(false)
    })
  }

  componentWillUnmount() {
    this.unlistenHistory()
  }

  handleTopbarHeight = topbarHeight => {
    this.setState({ topbarHeight })
  }

  showFloatingMenu = floatingMenu => {
    this.setState({ floatingMenu: floatingMenu })
  }

  render() {
    const { floatingMenu, topbarHeight } = this.state
    const { pageProps, location, sidebarData, children } = this.props
    const sidebarClass = floatingMenu ? "nav-overlay" : "hidden-xs"

    return (
      <ResponsiveLayoutContext.Provider
        value={{
          showFloatingMenu: this.showFloatingMenu,
          topbarOffset: topbarHeight
        }}
      >
        <div style={anetContainer} className="anet">
          <TopBar
            topbarHeight={this.handleTopbarHeight}
            minimalHeader={pageProps.minimalHeader}
            location={location}
            toggleMenuAction={() => {
              this.showFloatingMenu(!floatingMenu)
            }}
          />
          <div style={contentContainer} className="content-container">
            <LoadingBar showFastActions style={loadingBar} />
            <div
              style={floatingMenu ? glassPane : null}
              onClick={() => {
                this.showFloatingMenu(false)
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
  }
}

export default withRouter(ResponsiveLayout)
