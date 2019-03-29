import "components/react-confirm-bootstrap.css"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button } from "react-bootstrap"
import Confirm from "react-confirm-bootstrap"

export default class TriggerableConfirm extends Component {
  static propTypes = {
    onConfirm: PropTypes.func,
    title: PropTypes.string,
    body: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    bsStyle: PropTypes.string,
    buttonLabel: PropTypes.string
  }

  render() {
    const {
      onConfirm,
      title,
      body,
      confirmText,
      cancelText,
      bsStyle,
      buttonLabel,
      ...otherProps
    } = this.props

    return (
      <Confirm
        onConfirm={onConfirm}
        title={title}
        body={body}
        confirmText={confirmText}
        cancelText={cancelText}
        dialogClassName="react-confirm-bootstrap-modal"
        confirmBSStyle="primary"
      >
        <Button
          bsStyle={bsStyle}
          {...otherProps}
          ref={input => (this.buttonRef = input)}
        >
          {buttonLabel}
        </Button>
      </Confirm>
    )
  }
}
