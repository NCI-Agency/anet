import * as Models from "models"
import AuthorizationGroupShow from "pages/admin/authorizationgroup/Show"
import LocationShow from "pages/locations/Show"
import OrganizationShow from "pages/organizations/Show"
import PersonShow from "pages/people/Show"
import PositionShow from "pages/positions/Show"
import ReportShow from "pages/reports/Show"
import TaskShow from "pages/tasks/Show"
import PropTypes from "prop-types"
import React from "react"

const MODEL_TO_COMPONENT = {
  [Models.AuthorizationGroup]: AuthorizationGroupShow,
  [Models.Location]: LocationShow,
  [Models.Organization]: OrganizationShow,
  [Models.Person]: PersonShow,
  [Models.Position]: PositionShow,
  [Models.Report]: ReportShow,
  [Models.Task]: TaskShow
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
