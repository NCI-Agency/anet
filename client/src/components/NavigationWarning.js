import PropTypes from "prop-types"
import React, { Component } from "react"
import { Prompt, withRouter } from "react-router-dom"

const LEAVE_WARNING =
  "Are you sure you wish to navigate away from the page? You will lose unsaved changes."

class NavigationWarning extends Component {
  static propTypes = {
    isBlocking: PropTypes.bool
  }

  onBeforeUnloadListener = event => {
    if (this.props.isBlocking) {
      event.returnValue = LEAVE_WARNING
      event.preventDefault()
    }
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.onBeforeUnloadListener)
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onBeforeUnloadListener)
  }

  render() {
    return <Prompt when={this.props.isBlocking} message={LEAVE_WARNING} />
  }
}

export default withRouter(NavigationWarning)
