import autobind from "autobind-decorator"
import AppContext from "components/AppContext"
import { routerRelatedPropTypes } from "components/Page"
import hopscotch from "hopscotch"
import "hopscotch/dist/css/hopscotch.css"
import { Person } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button } from "react-bootstrap"
import { withRouter } from "react-router-dom"
import TOUR_ICON from "resources/tour-icon.png"

const iconCss = {
  width: "20px",
  marginLeft: "8px"
}

const HOPSCOTCH_CONFIG = {
  bubbleWidth: 400
}

class BaseGuidedTour extends Component {
  static propTypes = {
    tour: PropTypes.func.isRequired,
    autostart: PropTypes.bool,
    onEnd: PropTypes.func,
    title: PropTypes.string,
    currentUser: PropTypes.instanceOf(Person),
    ...routerRelatedPropTypes
  }

  componentDidMount() {
    hopscotch.listen("end", this.onEnd)
    hopscotch.listen("close", this.onEnd)

    this.componentDidUpdate()
  }

  componentDidUpdate() {
    if (
      !this.runningTour &&
      this.props.autostart &&
      this.props.currentUser.uuid
    ) {
      this.startTour()
    }
  }

  componentWillUnmount() {
    hopscotch.unlisten("end", this.onEnd)
    hopscotch.unlisten("close", this.onEnd)
    if (this.runningTour) {
      this.endTour()
    }
  }

  render() {
    let title = this.props.title || "New to ANET? Take a guided tour"
    return (
      <Button
        bsStyle="link"
        onClick={this.onClick}
        className="persistent-tour-launcher"
      >
        {title}
        <img src={TOUR_ICON} className="tour-icon" alt="" style={iconCss} />
      </Button>
    )
  }

  @autobind
  onClick() {
    this.startTour()
  }

  startTour(stepId) {
    const { currentUser } = this.props
    let tour = this.props.tour(currentUser, this.props.history)

    // I don't know why hopscotch requires itself to be reconfigured
    // EVERY TIME you start a tour, but it does. so this does that.
    hopscotch.configure(HOPSCOTCH_CONFIG)

    hopscotch.startTour(tour, stepId)

    this.runningTour = true
  }

  endTour() {
    hopscotch.endTour()
    this.onEnd()

    this.runningTour = false
  }

  @autobind
  onEnd() {
    if (this.props.onEnd) {
      this.props.onEnd()
    }
  }
}

const GuidedTour = props => (
  <AppContext.Consumer>
    {context => <BaseGuidedTour currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default withRouter(GuidedTour)
