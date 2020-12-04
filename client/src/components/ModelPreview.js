import { OBJECT_TYPE_TO_MODEL } from "components/Model"
import AuthorizationGroupPreview from "components/previews/AuthorizationGroupPreview"
import LocationPreview from "components/previews/LocationPreview"
import OrganizationPreview from "components/previews/OrganizationPreview"
import PersonPreview from "components/previews/PersonPreview"
import PositionPreview from "components/previews/PositionPreview"
import ReportPreview from "components/previews/ReportPreview"
import TaskPreview from "components/previews/TaskPreview"
import PropTypes from "prop-types"
import React from "react"
import "./ModelPreview.css"

const MODEL_TYPE_TO_COMPONENT = {
  AuthorizationGroup: AuthorizationGroupPreview,
  Location: LocationPreview,
  Organization: OrganizationPreview,
  Person: PersonPreview,
  Position: PositionPreview,
  Report: ReportPreview,
  Task: TaskPreview
}

const ModelPreview = ({ modelType, ...props }) => {
  const ModelComp =
    MODEL_TYPE_TO_COMPONENT[modelType] ||
    MODEL_TYPE_TO_COMPONENT[OBJECT_TYPE_TO_MODEL[modelType]]
  if (!ModelComp) {
    return null
  }
  return <ModelComp {...props} className="model-preview" />
}

ModelPreview.propTypes = {
  modelType: PropTypes.string.isRequired
}

export default ModelPreview
