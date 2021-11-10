import { OBJECT_TYPE_TO_MODEL } from "components/Model"
import PropTypes from "prop-types"
import React from "react"
import "./ModelPreview.css"
import PreviewComponentFactory from "./PreviewComponentFactory"

const ModelPreview = ({ modelType, ...props }) => {
  const PreviewComponent =
    PreviewComponentFactory(modelType) ||
    PreviewComponentFactory(OBJECT_TYPE_TO_MODEL[modelType])
  if (!PreviewComponent) {
    return null
  }
  return <PreviewComponent {...props} className="model-preview" />
}

ModelPreview.propTypes = {
  modelType: PropTypes.string.isRequired
}

export default ModelPreview
