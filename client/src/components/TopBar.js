import { resetPages } from "actions"
import AppContext from "components/AppContext"
import GeneralBanner from "components/GeneralBanner"
import Header from "components/Header"
import NoPositionBanner from "components/NoPositionBanner"
import SecurityBanner from "components/SecurityBanner"
import { Person } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
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

class BaseTopBar extends Component {
  static propTypes = {
    currentUser: PropTypes.instanceOf(Person),
    appSettings: PropTypes.object,
    topbarHeight: PropTypes.func.isRequired,
    resetPages: PropTypes.func.isRequired,
    minimalHeader: PropTypes.bool,
    toggleMenuAction: PropTypes.func
  }

  constructor(props) {
    super(props)
    this.state = {
      bannerVisibility: false,
      height: 0
    }
    this.topbarDiv = React.createRef()
  }

  componentDidMount() {
    this.handleTopbarHeight()
    this.updateBannerVisibility()
    window.addEventListener("resize", this.handleTopbarHeight)
  }

  componentDidUpdate() {
    this.handleTopbarHeight()
    this.updateBannerVisibility()
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleTopbarHeight)
  }

  handleTopbarHeight = () => {
    const height = this.topbarDiv.current.clientHeight
    if (height !== undefined && height !== this.state.height) {
      this.setState({ height }, () =>
        this.props.topbarHeight(this.state.height)
      )
    }
  }

  handleOnHomeClick = () => {
    this.props.resetPages()
  }

  updateBannerVisibility() {
    const visibilitySetting = parseInt(
      this.props.appSettings[GENERAL_BANNER_VISIBILITY],
      10
    )
    let output = false
    const { currentUser } = this.props
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
    if (this.state.bannerVisibility !== output) {
      this.setState({ bannerVisibility: output })
    }
  }

  bannerOptions() {
    return (
      {
        level: this.props.appSettings[GENERAL_BANNER_LEVEL],
        message: this.props.appSettings[GENERAL_BANNER_TEXT],
        title: GENERAL_BANNER_TITLE,
        visible: this.state.bannerVisibility
      } || {}
    )
  }

  render() {
    const { currentUser, minimalHeader, toggleMenuAction } = this.props

    return (
      <div style={{ flex: "0 0 auto", zIndex: 1100 }} ref={this.topbarDiv}>
        <div id="topbar">
          <GeneralBanner options={this.bannerOptions()} />
          <SecurityBanner />
          {currentUser &&
            !currentUser.hasActivePosition() &&
            !currentUser.isNewUser() && <NoPositionBanner />}
          <Header
            minimalHeader={minimalHeader}
            toggleMenuAction={toggleMenuAction}
            onHomeClick={this.handleOnHomeClick}
          />
        </div>
      </div>
    )
  }
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
