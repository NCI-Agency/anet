import { Tooltip } from "@blueprintjs/core"
import ModelPreview from "components/ModelPreview"
import PropTypes from "prop-types"
import React from "react"
import "./ModelTooltip.css"

const ModelTooltip = ({
  modelType,
  uuid,
  previewId,
  isEdit,
  children,
  ...tooltipProps
}) => {
  // edit links would show the same page, don't preview
  if (isEdit) {
    return <>{children}</>
  }
  return (
    <Tooltip
      content={
        <ModelPreview modelType={modelType} uuid={uuid} previewId={previewId} />
      }
      {...tooltipProps}
    >
      {children}
    </Tooltip>
  )
}

ModelTooltip.propTypes = {
  children: PropTypes.node,
  modelType: PropTypes.string.isRequired,
  uuid: PropTypes.string,
  previewId: PropTypes.string,
  isEdit: PropTypes.bool
}

export default ModelTooltip
