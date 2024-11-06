import { OBJECT_TYPE_TO_MODEL } from "components/Model"
import React from "react"
import "./ModelPreview.css"
import PreviewComponentFactory from "./PreviewComponentFactory"

interface ModelPreviewProps {
  modelType: string
}

const ModelPreview = ({ modelType, ...props }: ModelPreviewProps) => {
  const PreviewComponent =
    PreviewComponentFactory(modelType) ||
    PreviewComponentFactory(OBJECT_TYPE_TO_MODEL[modelType])
  if (!PreviewComponent) {
    return null
  }
  return <PreviewComponent {...props} className="model-preview" />
}

export default ModelPreview
