import AuthorizationGroupPreview from "components/previews/AuthorizationGroupPreview"
import LocationPreview from "components/previews/LocationPreview"
import OrganizationPreview from "components/previews/OrganizationPreview"
import PersonPreview from "components/previews/PersonPreview"
import PositionPreview from "components/previews/PositionPreview"
import ReportPreview from "components/previews/ReportPreview"
import TaskPreview from "components/previews/TaskPreview"
import * as Models from "models"
import PropTypes from "prop-types"
import React from "react"
import "./ModelPreview.css"

const MODEL_TO_COMPONENT = {
  [Models.AuthorizationGroup]: AuthorizationGroupPreview,
  [Models.Location]: LocationPreview,
  [Models.Organization]: OrganizationPreview,
  [Models.Person]: PersonPreview,
  [Models.Position]: PositionPreview,
  [Models.Report]: ReportPreview,
  [Models.Task]: TaskPreview
}

Object.entries(MODEL_TO_COMPONENT).forEach(([model, preview]) => {
  console.dir("model")
  console.dir(model)
  console.dir("preview")
  console.dir(preview)
})

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
