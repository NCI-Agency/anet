import { Tooltip } from "@blueprintjs/core"
import ModelPreview from "components/ModelPreview"
import PropTypes from "prop-types"
import React from "react"

const ModelTooltip = ({ modelClass, uuid, children, ...tooltipProps }) => {
  return (
    <Tooltip
      content={<ModelPreview modelClass={modelClass} uuid={uuid} />}
      {...tooltipProps}
    >
      {children}
    </Tooltip>
  )
}

ModelTooltip.propTypes = {
  children: PropTypes.node,
  modelClass: PropTypes.func,
  uuid: PropTypes.string
}

export default ModelTooltip
