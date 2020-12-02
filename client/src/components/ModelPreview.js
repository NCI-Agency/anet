import PersonPreview from "components/previews/PersonPreview"
import ReportPreview from "components/previews/ReportPreview"
import * as Models from "models"
import PropTypes from "prop-types"
import React from "react"
import "./ModelPreview.css"

const MODEL_TO_COMPONENT = {
  [Models.AuthorizationGroup]: ReportPreview,
  [Models.Location]: ReportPreview,
  [Models.Organization]: ReportPreview,
  [Models.Person]: PersonPreview,
  [Models.Position]: ReportPreview,
  [Models.Report]: ReportPreview,
  [Models.Task]: ReportPreview
}

const ModelPreview = ({ modelClass, ...props }) => {
  const ModelComp = MODEL_TO_COMPONENT[modelClass]
  if (!ModelComp) {
    return null
  }
  return <ModelComp {...props} className="model-preview" />
}

ModelPreview.propTypes = {
  modelClass: PropTypes.func
}

export default ModelPreview
