import PropTypes from 'prop-types'
import React, { Component } from 'react'

export default class NavWrap extends Component {
  static propTypes = {
    children: PropTypes.object,
  }

  render() {
    const {
      active,
      activeKey,
      activeHref,
      onSelect,

      children,

      ...otherProps
    } = this.props

    return (
      <li role="presentation" {...otherProps}>
        {children}
      </li>
    )
  }
}
