import { Tooltip } from "@blueprintjs/core"
import ModelPreview from "components/ModelPreview"
import PropTypes from "prop-types"
import React from "react"
import "./ModelTooltip.css"

const ModelTooltip = ({
  modelType,
  uuid,
  previewId,
  children,
  ...tooltipProps
}) => {
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
  previewId: PropTypes.string
}

export default ModelTooltip
