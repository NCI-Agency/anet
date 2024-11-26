import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import React from "react"
import { Button } from "react-bootstrap"

interface RemoveButtonProps {
  title?: string
  altText?: string
  onClick?: (...args: unknown[]) => unknown
  buttonStyle?: string
  disabled?: boolean
}

const RemoveButton = ({
  title,
  altText,
  onClick,
  buttonStyle = "outline-danger",
  disabled = false
}: RemoveButtonProps) => (
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

export default RemoveButton
