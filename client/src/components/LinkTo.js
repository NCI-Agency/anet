import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { OBJECT_TYPE_TO_MODEL } from "components/Model"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Link } from "react-router-dom"

export default class LinkTo extends Component {
  static propTypes = {
    componentClass: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.object
    ]),
    children: PropTypes.node,
    className: PropTypes.string,

    showIcon: PropTypes.bool,
    showAvatar: PropTypes.bool,
    isLink: PropTypes.bool,
    edit: PropTypes.bool,

    // Configures this link to look like a button. Set it to true to make it a button,
    // or pass a string to set a button type
    button: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),

    target: PropTypes.string,
    whenUnspecified: PropTypes.string,
    modelType: PropTypes.string.isRequired,
    model: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    style: PropTypes.object
  }

  static defaultProps = {
    componentClass: Link,
    showIcon: true,
    showAvatar: true,
    isLink: true,
    edit: false,
    button: false,
    whenUnspecified: "Unspecified",
    modelType: null,
    model: null
  }

  render() {
    const {
      componentClass,
      children,
      edit,
      button,
      showIcon,
      showAvatar,
      isLink,
      whenUnspecified,
      className,
      modelType,
      model,
      style,
      ...componentProps
    } = this.props

    if (button) {
      componentProps.className = [
        className,
        "btn",
        `btn-${button === true ? "default" : button}`
      ].join(" ")
    } else {
      componentProps.className = className
    }

    if (_isEmpty(model)) {
      return <span>{whenUnspecified}</span>
    }

    const ModelClass =
      Models[modelType] || Models[OBJECT_TYPE_TO_MODEL[modelType]]
    const isModel = typeof model !== "string"
    const modelInstance = new ModelClass(isModel ? model : {})

    // Icon
    const iconComponent = showIcon && !button && modelInstance.iconUrl() && (
      <img
        src={modelInstance.iconUrl()}
        alt=""
        style={{ marginLeft: 5, marginRight: 5, height: "1em" }}
      />
    )

    // Avatar
    const avatarComponent = showAvatar &&
      !button &&
      Object.prototype.hasOwnProperty.call(model, "avatar") && (
        <AvatarDisplayComponent
          avatar={modelInstance.avatar}
          height={32}
          width={32}
          style={{ marginLeft: 5, marginRight: 5 }}
        />
    )

    if (!isLink) {
      return (
        <span style={style}>
          {avatarComponent}
          {modelInstance.toString()}
        </span>
      )
    }

    let to
    if (isModel) {
      to = edit
        ? ModelClass.pathForEdit(modelInstance)
        : ModelClass.pathFor(modelInstance)
    } else if (model.indexOf("?")) {
      const components = model.split("?")
      to = { pathname: components[0], search: components[1] }
    } else {
      to = model
    }

    const LinkToComponent = componentClass
    return (
      <LinkToComponent to={to} style={style} {...componentProps}>
        <>
          {iconComponent}
          {avatarComponent}
          {children || modelInstance.toString()}
        </>
      </LinkToComponent>
    )
  }
}
