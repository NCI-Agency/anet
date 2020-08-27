import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"

const RemoveButton = ({
  title,
  altText,
  onClick,
  buttonStyle = "default",
  disabled = false
}) => (
  <Button
    className="pull-right"
    bsStyle={buttonStyle}
    title={title}
    onClick={onClick}
    disabled={disabled}
  >
    <img src={REMOVE_ICON} height={14} alt={altText} />
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
