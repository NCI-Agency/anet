import { PopoverInteractionKind } from "@blueprintjs/core"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import Model, { OBJECT_TYPE_TO_MODEL } from "components/Model"
import ModelTooltip from "components/ModelTooltip"
import ModelPreview from "components/previews/ModelPreview"
import _isEmpty from "lodash/isEmpty"
import * as Models from "models"
import React, { useContext } from "react"
import { Link } from "react-router-dom"

const HOVER_OPEN_DELAY = process.env.ANET_TEST_MODE === "true" ? 60000 : 500
const TOP_LEVEL = 0
const LinkToContext = React.createContext({ level: TOP_LEVEL })

interface LinkToWithOptionalPreviewProps {
  level: number
  modelType: string
  modelInstance: any
  targetProps: object
  linkComponent: React.JSX.Element
  showPreview: boolean
}

const LinkToWithOptionalPreview = ({
  level,
  linkComponent,
  modelInstance,
  modelType,
  targetProps,
  showPreview
}: LinkToWithOptionalPreviewProps) => (
  <LinkToContext.Provider value={{ level: level + 1 }}>
    {showPreview ? (
      <ModelTooltip
        tooltipContent={
          <ModelPreview modelType={modelType} uuid={modelInstance.uuid} />
        }
        targetProps={targetProps}
        popoverClassName="bp6-dark"
        hoverCloseDelay={400}
        hoverOpenDelay={HOVER_OPEN_DELAY}
        portalClassName="linkto-model-preview-portal"
        interactionKind={PopoverInteractionKind.HOVER}
        boundary="viewport"
      >
        {linkComponent}
      </ModelTooltip>
    ) : (
      linkComponent
    )}
  </LinkToContext.Provider>
)

interface LinkToProps {
  as?: React.ReactNode
  children?: React.ReactNode
  className?: string
  showIcon?: boolean
  showAvatar?: boolean
  showPreview?: boolean
  isLink?: boolean
  edit?: boolean
  // Configures this link to look like a button. Set it to true to make it a button,
  // or pass a string to set a button type
  button?: boolean | string
  variant?: string
  target?: string
  whenUnspecified?: string
  modelType: string
  model?: typeof Model | string
  displayCallback?: (...args: unknown[]) => unknown
  style?: any
  tooltipProps?: object
}

const LinkTo = ({
  as: LinkToComponent = Link,
  children,
  edit = false,
  button = false,
  variant,
  showIcon = true,
  showAvatar = true,
  showPreview = true,
  isLink = true,
  whenUnspecified = "Unspecified",
  className,
  modelType = null,
  model = null,
  style,
  tooltipProps,
  displayCallback = null,
  ...componentProps
}: LinkToProps) => {
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
  let avatarComponent = null
  if (showAvatar && !button) {
    if (Object.hasOwn(model, "entityAvatar")) {
      avatarComponent = (
        <EntityAvatarDisplay
          avatar={modelInstance.entityAvatar}
          defaultAvatar={ModelClass.relatedObjectType}
          height={32}
          width={32}
          style={{ marginLeft: 5, marginRight: 5 }}
        />
      )
    }
  }

  const linkToClassName = button
    ? null
    : `link-to-entity link-to-${modelInstance.status ?? "UNKNOWN"}-entity`
  if (!isLink) {
    const linkStyle = showPreview ? { cursor: "help", ...style } : null
    const linkComponent = (
      <span style={linkStyle} className={linkToClassName}>
        <span>
          {iconComponent}
          {avatarComponent}
          {children || modelInstance.toString(displayCallback)}
        </span>
      </span>
    )
    return (
      <LinkToWithOptionalPreview
        level={level}
        modelType={modelType}
        modelInstance={modelInstance}
        targetProps={tooltipProps}
        linkComponent={linkComponent}
        showPreview={showPreview}
      />
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

  const linkComponent = (
    <span className={linkToClassName}>
      <LinkToComponent to={to} style={style} {...componentProps}>
        {iconComponent}
        {avatarComponent}
        {children || modelInstance.toString(displayCallback)}
      </LinkToComponent>
    </span>
  )
  return (
    <LinkToWithOptionalPreview
      level={level}
      modelType={modelType}
      modelInstance={modelInstance}
      targetProps={tooltipProps}
      linkComponent={linkComponent}
      showPreview={showPreview && !button && level === TOP_LEVEL}
    />
  )
}

export default LinkTo
