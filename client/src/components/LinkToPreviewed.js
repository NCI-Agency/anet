import { PopoverInteractionKind } from "@blueprintjs/core"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { OBJECT_TYPE_TO_MODEL } from "components/Model"
import ModelPreview from "components/previews/ModelPreview"
import ModelTooltip from "components/ModelTooltip"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import PropTypes from "prop-types"
import React from "react"
import { Link } from "react-router-dom"

const LinkToPreviewed = ({
  componentClass,
  children,
  showIcon,
  showAvatar,
  whenUnspecified,
  className,
  modelType,
  model,
  style,
  previewId,
  ...componentProps
}) => {
  componentProps.className = className
  if (_isEmpty(model)) {
    return <span>{whenUnspecified}</span>
  }

  const ModelClass =
    Models[modelType] || Models[OBJECT_TYPE_TO_MODEL[modelType]]
  const isModel = typeof model !== "string"
  const modelInstance = new ModelClass(isModel ? model : {})

  // Icon
  const iconComponent = showIcon && modelInstance.iconUrl() && (
    <img
      src={modelInstance.iconUrl()}
      alt=""
      style={{ marginLeft: 5, marginRight: 5, height: "1em" }}
    />
  )

  // Avatar
  const avatarComponent = showAvatar &&
    Object.prototype.hasOwnProperty.call(model, "avatar") && (
      <AvatarDisplayComponent
        avatar={modelInstance.avatar}
        height={32}
        width={32}
        style={{ marginLeft: 5, marginRight: 5 }}
      />
  )

  let to
  if (isModel) {
    to = ModelClass.pathFor(modelInstance)
  } else if (model.indexOf("?")) {
    const components = model.split("?")
    to = { pathname: components[0], search: components[1] }
  } else {
    to = model
  }

  const LinkToComponent = componentClass
  return (
    <ModelTooltip
      tooltipContent={
        <ModelPreview
          modelType={modelType}
          uuid={modelInstance.uuid}
          previewId={previewId}
        />
      }
      popoverClassName="bp3-dark"
      hoverCloseDelay={400}
      hoverOpenDelay={500}
      portalClassName="linkto-model-preview-portal"
      interactionKind={PopoverInteractionKind.HOVER}
      boundary="viewport"
    >
      <LinkToComponent to={to} style={style} {...componentProps}>
        <>
          {iconComponent}
          {avatarComponent}
          {children || modelInstance.toString()}
        </>
      </LinkToComponent>
    </ModelTooltip>
  )
}

LinkToPreviewed.propTypes = {
  componentClass: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.object
  ]),
  children: PropTypes.node,
  className: PropTypes.string,
  showIcon: PropTypes.bool,
  showAvatar: PropTypes.bool,
  previewId: PropTypes.string, // needed for previewing same pages multiple times
  target: PropTypes.string,
  whenUnspecified: PropTypes.string,
  modelType: PropTypes.string.isRequired,
  model: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  style: PropTypes.object
}

LinkToPreviewed.defaultProps = {
  componentClass: Link,
  showIcon: true,
  showAvatar: true,
  previewId: null,
  whenUnspecified: "Unspecified",
  modelType: null,
  model: null
}

export default LinkToPreviewed
