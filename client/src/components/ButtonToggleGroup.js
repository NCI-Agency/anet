import PropTypes from "prop-types"
import React from "react"
import { Button, ButtonGroup } from "react-bootstrap"

const ButtonToggleGroup = ({ value, onChange, children, ...otherProps }) => (
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
ButtonToggleGroup.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  children: PropTypes.node
}

export default ButtonToggleGroup
