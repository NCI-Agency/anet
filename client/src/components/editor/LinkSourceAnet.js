import React, { Component } from "react"
import PropTypes from "prop-types"

import { Button, Modal } from "react-bootstrap"

import "./LinkSource.css"

import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"
import PEOPLE_ICON from "resources/people.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import LOCATIONS_ICON from "resources/locations.png"
import POSITIONS_ICON from "resources/positions.png"
import { Organization, Person, Position, Task, Location, Report } from "models"
import {
  ReportOverlayRow,
  OrganizationOverlayRow,
  TaskSimpleOverlayRow,
  PersonSimpleOverlayRow,
  PositionOverlayRow,
  LocationOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"

import {
  SEARCH_OBJECT_LABELS,
  SEARCH_OBJECT_TYPES,
  DEFAULT_SEARCH_PROPS
} from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import createEntity from "./utils/createEntity"

const entityFilters = {
  allEntities: {
    label: "All entities",
    queryVars: {}
  }
}

const widgetPropsReport = {
  objectType: Report,
  overlayRenderRow: ReportOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: {},
  fields: Report.autocompleteQuery,
  addon: REPORTS_ICON
}

const widgetPropsPeople = {
  objectType: Person,
  overlayRenderRow: PersonSimpleOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: {},
  fields: Person.autocompleteQuery,
  addon: PEOPLE_ICON
}

const widgetPropsOrganization = {
  objectType: Organization,
  overlayRenderRow: OrganizationOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: {},
  fields: Organization.autocompleteQuery,
  addon: ORGANIZATIONS_ICON
}

const widgetPropsPosition = {
  objectType: Position,
  overlayRenderRow: PositionOverlayRow,
  overlayColumns: ["Position", "Organization", "Current Occupant"],
  filterDefs: entityFilters,
  queryParams: {},
  fields: Position.autocompleteQuery,
  addon: POSITIONS_ICON
}

const widgetPropsLocation = {
  objectType: Location,
  overlayRenderRow: LocationOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Location.STATUS.ACTIVE },
  fields: Location.autocompleteQuery,
  addon: LOCATIONS_ICON
}

const widgetPropsTask = {
  objectType: Task,
  overlayRenderRow: TaskSimpleOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Task.STATUS.ACTIVE },
  fields: Task.autocompleteQuery,
  addon: TASKS_ICON
}

var widgetTypeMapping = new Map([
  [SEARCH_OBJECT_TYPES.REPORTS, widgetPropsReport],
  [SEARCH_OBJECT_TYPES.PEOPLE, widgetPropsPeople],
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS, widgetPropsOrganization],
  [SEARCH_OBJECT_TYPES.POSITIONS, widgetPropsPosition],
  [SEARCH_OBJECT_TYPES.LOCATIONS, widgetPropsLocation],
  [SEARCH_OBJECT_TYPES.TASKS, widgetPropsTask]
])

class LinkSourceAnet extends Component {
  constructor(props) {
    super(props)

    this.state = {
      objectType: SEARCH_OBJECT_TYPES.REPORTS,
      advancedSelectProps: widgetPropsReport
    }
  }

  onConfirm = value => {
    console.log(value)

    const { editorState, entityType, onComplete } = this.props

    let nextState = createEntity(
      editorState,
      entityType.type,
      {
        url: "\\" + this.state.objectType.toLowerCase() + "/" + value.uuid
      },
      value.name || value.longName || value.shortName || value.intent,
      "MUTABLE"
    )

    onComplete(nextState)
  }

  onRequestClose = () => {
    const { onClose } = this.props
    onClose()
  }

  onAfterOpen = () => {
    const input = this.inputRef

    if (input) {
      input.focus()
      input.select()
    }
  }

  changeObjectType = objectType => {
    this.setState({
      objectType: objectType,
      advancedSelectProps: widgetTypeMapping.get(objectType)
    })
  }

  render() {
    return (
      <Modal
        show
        aria-labelledby="Link chooser"
        onHide={this.onRequestClose}
        onEntered={this.onAfterOpen}
      >
        <Modal.Header closeButton>
          <Modal.Title>Search ANET entities</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ButtonToggleGroup
            value={this.state.objectType}
            onChange={this.changeObjectType}
          >
            {DEFAULT_SEARCH_PROPS.searchObjectTypes.map(type => (
              <Button key={type} value={type}>
                {SEARCH_OBJECT_LABELS[type]}
              </Button>
            ))}
          </ButtonToggleGroup>

          <AdvancedSingleSelect
            fieldName="entitySelect"
            fieldLabel="Search in ANET:"
            placeholder={"Search in ANET"}
            value={{}}
            overlayColumns={this.state.advancedSelectProps.overlayColumns}
            overlayRenderRow={this.state.advancedSelectProps.overlayRenderRow}
            filterDefs={this.state.advancedSelectProps.filterDefs}
            onChange={value => this.onConfirm(value)}
            objectType={this.state.advancedSelectProps.objectType}
            queryParams={this.state.advancedSelectProps.queryParams}
            fields={this.state.advancedSelectProps.fields}
            addon={this.state.advancedSelectProps.addon}
          />
        </Modal.Body>
      </Modal>
    )
  }
}

LinkSourceAnet.propTypes = {
  editorState: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  entityType: PropTypes.object.isRequired
}

export default LinkSourceAnet
