// @flow
import React, { Component } from "react"
import PropTypes from "prop-types"
import Tooltip from "components/Tooltip"
import Portal from "components/Portal"

// Constraints the maximum size of the tooltip.
const OPTIONS_MAX_WIDTH = 300
const OPTIONS_SPACING = 70
const TOOLTIP_MAX_WIDTH = OPTIONS_MAX_WIDTH + OPTIONS_SPACING

/**
 * Editor block to preview and edit images.
 */
class MediaBlock extends Component {
  constructor(props) {
    super(props)

    this.state = {
      tooltip: null
    }

    this.openTooltip = this.openTooltip.bind(this)
    this.closeTooltip = this.closeTooltip.bind(this)
    this.renderTooltip = this.renderTooltip.bind(this)
  }

  /* :: openTooltip: (e: Event) => void; */
  openTooltip(e) {
    const trigger = e.target

    if (
      trigger instanceof Element &&
      trigger.parentNode instanceof HTMLElement
    ) {
      const containerWidth = trigger.parentNode.offsetWidth

      this.setState({
        tooltip: {
          target: trigger.getBoundingClientRect(),
          containerWidth
        }
      })
    }
  }

  /* :: closeTooltip: () => void; */
  closeTooltip() {
    this.setState({ tooltip: null })
  }

  /* :: renderTooltip: () => ?Node; */
  renderTooltip() {
    const { children } = this.props
    const { tooltip } = this.state

    if (!tooltip) {
      return null
    }

    const maxWidth = tooltip.containerWidth - tooltip.target.width
    const direction = maxWidth >= TOOLTIP_MAX_WIDTH ? "left" : "top-left"

    return (
      <Portal
        onClose={this.closeTooltip}
        closeOnClick
        closeOnType
        closeOnResize
      >
        <Tooltip target={tooltip.target} direction={direction}>
          <div style={{ maxWidth: OPTIONS_MAX_WIDTH }}>{children}</div>
        </Tooltip>
      </Portal>
    )
  }

  render() {
    const { blockProps, src, label, isLoading } = this.props
    const { entityType } = blockProps

    return (
      <button
        type="button"
        tabIndex={-1}
        className={`MediaBlock${isLoading ? " MediaBlock--loading" : ""}`}
        aria-label={`${entityType.description}${label ? ": " : ""}${label}`}
        onMouseUp={this.openTooltip}
      >
        <span className="MediaBlock__icon-wrapper" aria-hidden>
          {/* <Icon icon={entityType.icon} className="MediaBlock__icon" /> */}
        </span>

        <img className="MediaBlock__img" src={src} alt="" width="256" />

        {this.renderTooltip()}
      </button>
    )
  }
}

MediaBlock.propTypes = {
  blockProps: PropTypes.object.isRequired,
  children: PropTypes.any.isRequired,
  entityType: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  label: PropTypes.string,
  src: PropTypes.string.isRequired
}

export default MediaBlock
