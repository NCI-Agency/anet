import { PopoverInteractionKind } from "@blueprintjs/core"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { OBJECT_TYPE_TO_MODEL } from "components/Model"
import ModelTooltip from "components/ModelTooltip"
import ModelPreview from "components/previews/ModelPreview"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Link } from "react-router-dom"

const HOVER_OPEN_DELAY = process.env.ANET_TEST_MODE === "true" ? 60000 : 500
const TOP_LEVEL = 0
const LinkToContext = React.createContext({ level: TOP_LEVEL })

const LinkTo = ({
  as: LinkToComponent,
  children,
  edit,
  button,
  variant,
  showIcon,
  showAvatar,
  isLink,
  whenUnspecified,
  className,
  modelType,
  model,
  style,
  displayCallback,
  ...componentProps
}) => {
  const { level } = useContext(LinkToContext)
  if (button) {
    componentProps.className = [
      className,
      "btn",
      `btn-${button === true ? (variant ?? "outline-secondary") : button}`
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
  const iconUrl = modelInstance.iconUrl()
  const iconComponent = showIcon && !button && iconUrl && (
    <img
      src={iconUrl}
      alt=""
      style={{ marginLeft: 5, marginRight: 5, height: "1em" }}
    />
  )

  // Avatar
  const avatarComponent = showAvatar &&
    !button &&
    Object.hasOwn(model, "avatarUuid") && (
      <AvatarDisplayComponent
        avatarUuid={modelInstance.avatarUuid}
        height={32}
        width={32}
        style={{ marginLeft: 5, marginRight: 5 }}
      />
  )

  if (!isLink) {
    return (
      <LinkToContext.Provider value={{ level: level + 1 }}>
        <ModelTooltip
          tooltipContent={
            <ModelPreview modelType={modelType} uuid={modelInstance.uuid} />
          }
          popoverClassName="bp5-dark"
          hoverCloseDelay={400}
          hoverOpenDelay={HOVER_OPEN_DELAY}
          portalClassName="linkto-model-preview-portal"
          interactionKind={PopoverInteractionKind.HOVER}
          boundary="viewport"
        >
          <span style={{ cursor: "help", ...style }}>
            {avatarComponent}
            {modelInstance.toString(displayCallback)}
            {children}
          </span>
        </ModelTooltip>
      </LinkToContext.Provider>
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

  const LinkComponent = (
    <LinkToComponent to={to} style={style} {...componentProps}>
      <>
        {iconComponent}
        {avatarComponent}
        {children || modelInstance.toString(displayCallback)}
      </>
    </LinkToComponent>
  )
  if (!button && level === TOP_LEVEL) {
    // Show popover when hovering over link
    return (
      <LinkToContext.Provider value={{ level: level + 1 }}>
        <ModelTooltip
          tooltipContent={
            <ModelPreview modelType={modelType} uuid={modelInstance.uuid} />
          }
          popoverClassName="bp5-dark"
          hoverCloseDelay={400}
          hoverOpenDelay={HOVER_OPEN_DELAY}
          portalClassName="linkto-model-preview-portal"
          interactionKind={PopoverInteractionKind.HOVER}
          boundary="viewport"
        >
          {LinkComponent}
        </ModelTooltip>
      </LinkToContext.Provider>
    )
  }
  // Show regular link
  return (
    <LinkToContext.Provider value={{ level: level + 1 }}>
      {LinkComponent}
    </LinkToContext.Provider>
  )
}

LinkTo.propTypes = {
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  children: PropTypes.node,
  className: PropTypes.string,
  showIcon: PropTypes.bool,
  showAvatar: PropTypes.bool,
  isLink: PropTypes.bool,
  edit: PropTypes.bool,
  // Configures this link to look like a button. Set it to true to make it a button,
  // or pass a string to set a button type
  button: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  variant: PropTypes.string,
  target: PropTypes.string,
  whenUnspecified: PropTypes.string,
  modelType: PropTypes.string.isRequired,
  model: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  displayCallback: PropTypes.func,
  style: PropTypes.object
}

LinkTo.defaultProps = {
  as: Link,
  showIcon: true,
  showAvatar: true,
  isLink: true,
  edit: false,
  button: false,
  whenUnspecified: "Unspecified",
  modelType: null,
  displayCallback: null,
  model: null
}

export default LinkTo
