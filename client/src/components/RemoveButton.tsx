import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import classNames from "classnames"
import React from "react"
import { Button } from "react-bootstrap"

interface RemoveButtonProps {
  title?: string
  className?: string
  onClick?: (...args: unknown[]) => unknown
  buttonStyle?: string
  disabled?: boolean
}

const RemoveButton = ({
  title,
  className = "float-end",
  onClick,
  buttonStyle = "outline-danger",
  disabled = false
}: RemoveButtonProps) => (
  <Button
    className={classNames(className, "remove-button")}
    variant={buttonStyle}
    title={title}
    onClick={onClick}
    disabled={disabled}
  >
    <Icon icon={IconNames.REMOVE} />
  </Button>
)

export default RemoveButton
