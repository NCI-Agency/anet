import "components/react-confirm-bootstrap.css"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button } from "react-bootstrap"
import Confirm from "react-confirm-bootstrap"

export default class ConfirmDelete extends Component {
  static propTypes = {
    onConfirmDelete: PropTypes.func,
    objectType: PropTypes.string,
    objectDisplay: PropTypes.string,
    bsStyle: PropTypes.string,
    buttonLabel: PropTypes.string,
    children: PropTypes.node
  }

  render() {
    const {
      onConfirmDelete,
      objectType,
      objectDisplay,
      bsStyle,
      buttonLabel,
      children,
      ...otherProps
    } = this.props
    const confirmDeleteText = `Yes, I am sure that I want to delete ${objectType} ${objectDisplay}`
    const title = `Confirm to delete ${objectType}`
    const body = `Are you sure you want to delete this ${objectType}? This cannot be undone.`

    return (
      <Confirm
        onConfirm={onConfirmDelete}
        title={title}
        body={body}
        confirmText={confirmDeleteText}
        cancelText="No, I am not entirely sure at this point"
        dialogClassName="react-confirm-bootstrap-modal"
        confirmBSStyle="primary"
      >
        <Button bsStyle={bsStyle} {...otherProps}>
          {buttonLabel}
          {children}
        </Button>
      </Confirm>
    )
  }
}
