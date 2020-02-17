import { SEARCH_OBJECT_LABELS } from "actions"
import {
  LocationOverlayRow,
  OrganizationOverlayRow,
  PersonDetailedOverlayRow,
  PositionOverlayRow,
  ReportDetailedOverlayRow,
  TaskSimpleOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useRef, useState } from "react"
import { Button, Modal } from "react-bootstrap"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"
import { ENTITY_TYPES } from "utils_links"
import "./LinkSource.css"
import createEntity from "./utils/createEntity"

const entityFilters = {
  allEntities: {
    label: "All entities",
    queryVars: {}
  }
}

const peopleFilters = {
  allEntities: {
    label: "All",
    queryVars: { matchPositionName: true }
  },
  activeAdvisors: {
    label: "All advisors",
    queryVars: { role: Models.Person.ROLE.ADVISOR, matchPositionName: true }
  },
  activePrincipals: {
    label: "All principals",
    queryVars: { role: Models.Person.ROLE.PRINCIPAL }
  }
}

const widgetPropsReport = {
  objectType: Models.Report,
  overlayRenderRow: ReportDetailedOverlayRow,
  overlayColumns: ["Goal", "Author", "Updated"],
  filterDefs: entityFilters,
  queryParams: {},
  fields: Models.Report.autocompleteQuery,
  addon: REPORTS_ICON
}

const widgetPropsPeople = {
  objectType: Models.Person,
  overlayRenderRow: PersonDetailedOverlayRow,
  overlayColumns: ["Name", "Position", "Location", "Organization"],
  filterDefs: peopleFilters,
  queryParams: {},
  fields: Models.Person.autocompleteQuery,
  addon: PEOPLE_ICON
}

const widgetPropsOrganization = {
  objectType: Models.Organization,
  overlayRenderRow: OrganizationOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: {},
  fields: Models.Organization.autocompleteQuery,
  addon: ORGANIZATIONS_ICON
}

const widgetPropsPosition = {
  objectType: Models.Position,
  overlayRenderRow: PositionOverlayRow,
  overlayColumns: ["Position", "Organization", "Current Occupant"],
  filterDefs: entityFilters,
  queryParams: {},
  fields: Models.Position.autocompleteQuery,
  addon: POSITIONS_ICON
}

const widgetPropsLocation = {
  objectType: Models.Location,
  overlayRenderRow: LocationOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Models.Location.STATUS.ACTIVE },
  fields: Models.Location.autocompleteQuery,
  addon: LOCATIONS_ICON
}

const widgetPropsTask = {
  objectType: Models.Task,
  overlayRenderRow: TaskSimpleOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Models.Task.STATUS.ACTIVE },
  fields: Models.Task.autocompleteQuery,
  addon: TASKS_ICON
}

const widgetTypeMapping = {
  [ENTITY_TYPES.REPORTS]: widgetPropsReport,
  [ENTITY_TYPES.PEOPLE]: widgetPropsPeople,
  [ENTITY_TYPES.ORGANIZATIONS]: widgetPropsOrganization,
  [ENTITY_TYPES.POSITIONS]: widgetPropsPosition,
  [ENTITY_TYPES.LOCATIONS]: widgetPropsLocation,
  [ENTITY_TYPES.TASKS]: widgetPropsTask
}

const LinkSourceAnet = ({ editorState, entityType, onComplete, onClose }) => {
  const [objectType, setObjectType] = useState(ENTITY_TYPES.REPORTS)
  const [advancedSelectProps, setAdvancedSelectProps] = useState(
    widgetTypeMapping[objectType]
  )

  const advancedSelectRef = useRef()

  function onConfirm(value) {
    // Retrieve entity URL and label
    const ModelClass = Models[objectType]
    const modelInstance = new ModelClass(value)
    const entityLabel = modelInstance.toString()
    const entityUrl = ModelClass.pathFor(modelInstance)

    const nextState = createEntity(
      editorState,
      entityType.type,
      {
        url: entityUrl
      },
      entityLabel,
      "IMMUTABLE"
    )

    onComplete(nextState)
  }

  function changeObjectType(newObjectType) {
    setObjectType(newObjectType)
    setAdvancedSelectProps(widgetTypeMapping[newObjectType])

    // Filter and type changed, need to update search results
    advancedSelectRef.current.refreshSearch()
  }

  return (
    <Modal show aria-labelledby="Link chooser" onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Link to ANET entity</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ButtonToggleGroup value={objectType} onChange={changeObjectType}>
          {Object.entries(ENTITY_TYPES).map((key, value) => {
            const entityName = key[1]
            const entityLabel = SEARCH_OBJECT_LABELS[key[0]]
            return (
              <Button key={entityName} value={entityName}>
                {entityLabel}
              </Button>
            )
          })}
        </ButtonToggleGroup>
      </Modal.Body>

      <Modal.Footer>
        <AdvancedSingleSelect
          ref={advancedSelectRef}
          autofocus="true"
          fieldName="entitySelect"
          fieldLabel="Search in ANET:"
          placeholder={"Find " + objectType.toLowerCase()}
          value={{}}
          showEmbedded
          overlayColumns={advancedSelectProps.overlayColumns}
          overlayRenderRow={advancedSelectProps.overlayRenderRow}
          filterDefs={advancedSelectProps.filterDefs}
          onChange={value => onConfirm(value)}
          objectType={advancedSelectProps.objectType}
          queryParams={advancedSelectProps.queryParams}
          fields={advancedSelectProps.fields}
          addon={advancedSelectProps.addon}
        />
      </Modal.Footer>
    </Modal>
  )
}

LinkSourceAnet.propTypes = {
  editorState: PropTypes.object,
  entityType: PropTypes.object,
  onComplete: PropTypes.func,
  onClose: PropTypes.func
}

export default LinkSourceAnet
