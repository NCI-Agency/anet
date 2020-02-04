import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Link } from "react-router-dom"
import utils from "utils"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"

const MODEL_NAMES = Object.keys(Models).map(key => {
  let camel = utils.camelCase(key)
  if (camel === "location") {
    camel = "anetLocation"
  }
  Models[camel] = Models[key]
  return camel
})

const modelPropTypes = MODEL_NAMES.reduce(
  (map, name) => ({
    ...map,
    [name]: PropTypes.oneOfType([
      PropTypes.instanceOf(Models[name]),
      PropTypes.object,
      PropTypes.string
    ])
  }),
  {}
)

export default class LinkTo extends Component {
  static propTypes = {
    componentClass: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.func,
      PropTypes.object
    ]),
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
    modelType: PropTypes.string,
    model: PropTypes.object,
    style: PropTypes.object,
    ...modelPropTypes
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
    let {
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

    const modelName =
      modelType ||
      Object.keys(componentProps).find(key => MODEL_NAMES.indexOf(key) !== -1)

    if (!modelName) {
      console.error("You called LinkTo without passing a Model as a prop")
      return null
    }

    const modelFields = model || this.props[modelName]
    if (_isEmpty(modelFields)) return <span>{whenUnspecified}</span>

    const ModelClass = Models[modelName]
    const isModel = typeof modelFields !== "string"
    const modelInstance = new ModelClass(isModel ? modelFields : {})

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
      Object.prototype.hasOwnProperty.call(modelFields, "avatar") && (
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

    let to = modelFields
    if (!isModel) {
      if (to.indexOf("?")) {
        const components = to.split("?")
        to = { pathname: components[0], search: components[1] }
      }
    } else {
      to = edit
        ? ModelClass.pathForEdit(modelInstance)
        : ModelClass.pathFor(modelInstance)
    }

    componentProps = Object.without(componentProps, modelName)

    const LinkToComponent = componentClass
    return (
      <LinkToComponent to={to} {...componentProps}>
        <>
          {iconComponent}
          {avatarComponent}
          {children || modelInstance.toString()}
        </>
      </LinkToComponent>
    )
  }
}
