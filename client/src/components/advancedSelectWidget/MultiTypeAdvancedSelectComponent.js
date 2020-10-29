import { SEARCH_OBJECT_LABELS, SEARCH_OBJECT_TYPES } from "actions"
import {
  LocationOverlayRow,
  OrganizationOverlayRow,
  PersonDetailedOverlayRow,
  PositionOverlayRow,
  ReportDetailedOverlayRow,
  TaskSimpleOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import Model from "components/Model"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useMemo, useState } from "react"
import { Button } from "react-bootstrap"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"
import { ENTITY_TYPES } from "utils_links"

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
  queryParams: {}, // allow any report, incl. one's own drafts
  fields: Models.Report.autocompleteQuery,
  addon: REPORTS_ICON
}

const widgetPropsPeople = {
  objectType: Models.Person,
  overlayRenderRow: PersonDetailedOverlayRow,
  overlayColumns: ["Name", "Position", "Location", "Organization"],
  filterDefs: peopleFilters,
  queryParams: {
    status: Model.STATUS.ACTIVE,
    pendingVerification: false
  },
  fields: Models.Person.autocompleteQueryWithNotes,
  addon: PEOPLE_ICON
}

const widgetPropsOrganization = {
  objectType: Models.Organization,
  overlayRenderRow: OrganizationOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Organization.autocompleteQuery,
  addon: ORGANIZATIONS_ICON
}

const widgetPropsPosition = {
  objectType: Models.Position,
  overlayRenderRow: PositionOverlayRow,
  overlayColumns: ["Position", "Organization", "Current Occupant"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Position.autocompleteQuery,
  addon: POSITIONS_ICON
}

const widgetPropsLocation = {
  objectType: Models.Location,
  overlayRenderRow: LocationOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Location.autocompleteQuery,
  addon: LOCATIONS_ICON
}

const widgetPropsTask = {
  objectType: Models.Task,
  overlayRenderRow: TaskSimpleOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Task.autocompleteQueryWithNotes,
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

const MultiTypeAdvancedSelectComponent = ({
  fieldName,
  onConfirm,
  objectType,
  entityTypes,
  value,
  isMultiSelect
}) => {
  const [entityType, setEntityType] = useState(
    objectType ||
      Object.values(ENTITY_TYPES).find(et => entityTypes.includes(et)) ||
      ENTITY_TYPES.REPORTS
  )
  const [advancedSelectProps, setAdvancedSelectProps] = useState(
    widgetTypeMapping[entityType]
  )
  function changeEntityType(newEntityType) {
    setEntityType(newEntityType)
    setAdvancedSelectProps(widgetTypeMapping[newEntityType])
  }
  const searchPlaceholder = useMemo(() => {
    const [key] = Object.entries(ENTITY_TYPES).find(
      ([, et]) => et === entityType
    )
    const entityLabel = SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES[key]]
    return "Find " + entityLabel.toLowerCase()
  }, [entityType])
  const SelectComponent = isMultiSelect
    ? AdvancedMultiSelect
    : AdvancedSingleSelect
  const extraSelectProps = isMultiSelect ? {} : { showRemoveButton: false }
  return (
    <>
      {entityTypes.length > 1 && (
        <ButtonToggleGroup value={entityType} onChange={changeEntityType}>
          {Object.entries(ENTITY_TYPES)
            .filter(([, et]) => entityTypes.includes(et))
            .map(([key, entityName], value) => {
              const entityLabel = SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES[key]]
              return (
                <Button key={entityName} value={entityName}>
                  {entityLabel}
                </Button>
              )
            })}
        </ButtonToggleGroup>
      )}

      <SelectComponent
        autofocus="true"
        fieldName={fieldName}
        fieldLabel="Search in ANET:"
        placeholder={searchPlaceholder}
        value={value}
        showEmbedded
        overlayColumns={advancedSelectProps.overlayColumns}
        overlayRenderRow={advancedSelectProps.overlayRenderRow}
        filterDefs={advancedSelectProps.filterDefs}
        onChange={value => onConfirm(value, entityType)}
        objectType={advancedSelectProps.objectType}
        queryParams={advancedSelectProps.queryParams}
        fields={advancedSelectProps.fields}
        addon={advancedSelectProps.addon}
        {...extraSelectProps}
      />
    </>
  )
}

MultiTypeAdvancedSelectComponent.propTypes = {
  fieldName: PropTypes.string,
  onConfirm: PropTypes.func,
  objectType: PropTypes.string,
  entityTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  isMultiSelect: PropTypes.bool.isRequired
}
MultiTypeAdvancedSelectComponent.defaultProps = {
  fieldName: "entitySelect",
  entityTypes: Object.values(ENTITY_TYPES),
  isMultiSelect: false
}

export default MultiTypeAdvancedSelectComponent
