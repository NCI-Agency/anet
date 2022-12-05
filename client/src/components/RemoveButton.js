import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"

const RemoveButton = ({
  title,
  altText,
  onClick,
  buttonStyle = "outline-danger",
  disabled = false
}) => (
  <Button
    className="float-end remove-button"
    variant={buttonStyle}
    title={title}
    onClick={onClick}
    disabled={disabled}
  >
    <Icon icon={IconNames.REMOVE} />
  </Button>
)

RemoveButton.propTypes = {
  title: PropTypes.string,
  altText: PropTypes.string,
  onClick: PropTypes.func,
  buttonStyle: PropTypes.string,
  disabled: PropTypes.bool
}

export default RemoveButton
