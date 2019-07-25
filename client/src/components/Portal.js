// @flow
import React, { Component } from "react"
import ReactDOM from "react-dom"
import PropTypes from "prop-types"

class Portal extends Component {
  componentDidMount() {
    const { onClose, closeOnClick, closeOnType, closeOnResize } = this.props

    if (!this.portal) {
      this.portal = document.createElement("div")

      if (document.body) {
        document.body.appendChild(this.portal)
      }

      if (onClose) {
        if (closeOnClick) {
          document.addEventListener("mouseup", this.onCloseEvent)
        }

        if (closeOnType) {
          document.addEventListener("keyup", this.onCloseEvent)
        }

        if (closeOnResize) {
          window.addEventListener("resize", onClose)
        }
      }
    }

    this.componentDidUpdate()
  }

  componentDidUpdate() {
    const { children } = this.props

    ReactDOM.render(<div>{children}</div>, this.portal)
  }

  componentWillUnmount() {
    const { onClose } = this.props

    if (document.body) {
      document.body.removeChild(this.portal)
    }

    document.removeEventListener("mouseup", this.onCloseEvent)
    document.removeEventListener("keyup", this.onCloseEvent)
    window.removeEventListener("resize", onClose)
  }

  /* :: onCloseEvent: (e: Event) => void; */
  onCloseEvent = e => {
    const { onClose } = this.props

    if (e.target instanceof Element && !this.portal.contains(e.target)) {
      onClose()
    }
  }

  render() {
    return null
  }
}

Portal.defaultProps = {
  children: null,
  closeOnClick: false,
  closeOnType: false,
  closeOnResize: false
}

Portal.propTypes = {
  children: PropTypes.any,
  onClose: PropTypes.func,
  closeOnClick: PropTypes.bool,
  closeOnType: PropTypes.bool,
  closeOnResize: PropTypes.bool
}

export default Portal
