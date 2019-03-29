import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Link } from "react-router-dom"
import utils from "utils"

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
    componentClass: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    className: PropTypes.string,

    showIcon: PropTypes.bool,
    isLink: PropTypes.bool,
    edit: PropTypes.bool,

    // Configures this link to look like a button. Set it to true to make it a button,
    // or pass a string to set a button type
    button: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),

    target: PropTypes.string,
    whenUnspecified: PropTypes.string,
    ...modelPropTypes
  }

  static defaultProps = {
    componentClass: Link,
    showIcon: true,
    isLink: true,
    edit: false,
    button: false,
    whenUnspecified: "Unspecified"
  }

  render() {
    let {
      componentClass,
      children,
      edit,
      button,
      showIcon,
      isLink,
      whenUnspecified,
      className,
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
    let modelName = Object.keys(componentProps).find(
      key => MODEL_NAMES.indexOf(key) !== -1
    )
    if (!modelName) {
      console.error("You called LinkTo without passing a Model as a prop")
      return null
    }

    const modelFields = this.props[modelName]
    if (_isEmpty(modelFields)) return <span>{whenUnspecified}</span>

    const modelClass = Models[modelName]
    const isModel = typeof modelFields !== "string"
    const modelInstance = new modelClass(isModel ? modelFields : {})
    showIcon = showIcon && !button
    const modelIcon = showIcon && modelInstance.iconUrl()

    if (!isLink) return <span>{modelInstance.toString()}</span>

    let to = modelFields
    if (!isModel) {
      if (to.indexOf("?")) {
        let components = to.split("?")
        to = { pathname: components[0], search: components[1] }
      }
    } else {
      to = edit
        ? modelClass.pathForEdit(modelInstance)
        : modelClass.pathFor(modelInstance)
    }

    componentProps = Object.without(componentProps, modelName)

    const LinkToComponent = componentClass
    return (
      <LinkToComponent to={to} {...componentProps}>
        <React.Fragment>
          {showIcon && modelIcon && (
            <img
              src={modelIcon}
              alt=""
              style={{ marginLeft: 5, marginRight: 5, height: "1em" }}
            />
          )}
          {children || modelInstance.toString()}
        </React.Fragment>
      </LinkToComponent>
    )
  }
}
