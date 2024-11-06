import React from "react"
import { Button, ButtonGroup } from "react-bootstrap"

interface ButtonToggleGroupProps {
  value?: string
  onChange?: (...args: unknown[]) => unknown
  children?: React.ReactNode
}

const ButtonToggleGroup = ({
  value,
  onChange,
  children,
  ...otherProps
}: ButtonToggleGroupProps) => (
  <ButtonGroup value={value} onChange={onChange} {...otherProps}>
    {children.map((child, index) => {
      if (!child) {
        return null
      }

      return (
        <Button
          key={child.props.value}
          {...child.props}
          active={value === child.props.value}
          onClick={e => onChange(e.currentTarget.value)}
          value={child.props.value}
        >
          {child.props.children}
        </Button>
      )
    })}
  </ButtonGroup>
)

export default ButtonToggleGroup
