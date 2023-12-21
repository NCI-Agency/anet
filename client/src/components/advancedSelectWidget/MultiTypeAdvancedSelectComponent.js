import { SEARCH_OBJECT_LABELS, SEARCH_OBJECT_TYPES } from "actions"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  LocationOverlayRow,
  OrganizationOverlayRow,
  PersonDetailedOverlayRow,
  PositionOverlayRow,
  ReportDetailedOverlayRow,
  TaskOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import Model from "components/Model"
import * as Models from "models"
import PropTypes from "prop-types"
import React, { useCallback, useMemo, useState } from "react"
import { Button } from "react-bootstrap"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"

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
  fields: Models.Organization.autocompleteQueryWithNotes,
  addon: ORGANIZATIONS_ICON
}

const widgetPropsPosition = {
  objectType: Models.Position,
  overlayRenderRow: PositionOverlayRow,
  overlayColumns: ["Position", "Organization", "Current Occupant"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Position.autocompleteQueryWithNotes,
  addon: POSITIONS_ICON
}

const generateLocationFilters = filter => {
  if (!filter?.typeFilter) {
    return entityFilters
  } else {
    const locationFilters = {}
    Object.entries(filter.typeFilter.filterValue).forEach((element, index) => {
      locationFilters[index] = {
        label: Models.Location.humanNameOfType(element[1]),
        queryVars: {
          status: Model.STATUS.ACTIVE,
          [filter.typeFilter.filterField]: element[1]
        }
      }
    })
    return locationFilters
  }
}

const widgetPropsLocation = {
  objectType: Models.Location,
  overlayRenderRow: LocationOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: generateLocationFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Location.autocompleteQueryWithNotes,
  addon: LOCATIONS_ICON
}

const widgetPropsTask = {
  objectType: Models.Task,
  overlayRenderRow: TaskOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Task.autocompleteQueryWithNotes,
  addon: TASKS_ICON
}

export const ENTITY_TYPES = {
  REPORTS: Models.Report.resourceName,
  PEOPLE: Models.Person.resourceName,
  ORGANIZATIONS: Models.Organization.resourceName,
  POSITIONS: Models.Position.resourceName,
  LOCATIONS: Models.Location.resourceName,
  TASKS: Models.Task.resourceName
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
  valueKey,
  isMultiSelect,
  filters,
  className
}) => {
  const [entityType, setEntityType] = useState(
    objectType ||
      Object.values(ENTITY_TYPES).find(et => entityTypes.includes(et)) ||
      ENTITY_TYPES.REPORTS
  )
  const [advancedSelectProps, setAdvancedSelectProps] = useState(
    widgetTypeMapping[entityType]
  )
  const changeEntityType = useCallback(newEntityType => {
    setEntityType(newEntityType)
    setAdvancedSelectProps(widgetTypeMapping[newEntityType])
  }, [])
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
  const extraSelectProps = isMultiSelect
    ? {}
    : { valueKey, showRemoveButton: false }
  const filterDefs =
    typeof advancedSelectProps.filterDefs === "function"
      ? advancedSelectProps.filterDefs(filters[0]?.[entityType])
      : advancedSelectProps.filterDefs

  return (
    <>
      {entityTypes.length > 1 && (
        <ButtonToggleGroup
          size="sm"
          value={entityType}
          onChange={changeEntityType}
          style={{ marginBottom: "5px" }}
        >
          {Object.entries(ENTITY_TYPES)
            .filter(([, et]) => entityTypes.includes(et))
            .map(([key, entityName]) => {
              const entityLabel = SEARCH_OBJECT_LABELS[SEARCH_OBJECT_TYPES[key]]
              return (
                <Button
                  key={entityName}
                  value={entityName}
                  variant="outline-secondary"
                >
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
        keepSearchText={entityTypes.length > 1}
        overlayColumns={advancedSelectProps.overlayColumns}
        overlayRenderRow={advancedSelectProps.overlayRenderRow}
        filterDefs={filterDefs}
        onChange={value => onConfirm(value, entityType)}
        objectType={advancedSelectProps.objectType}
        queryParams={advancedSelectProps.queryParams}
        fields={advancedSelectProps.fields}
        addon={advancedSelectProps.addon}
        className={className}
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
  valueKey: PropTypes.string,
  isMultiSelect: PropTypes.bool.isRequired,
  filters: PropTypes.array,
  className: PropTypes.string
}
MultiTypeAdvancedSelectComponent.defaultProps = {
  fieldName: "entitySelect",
  entityTypes: Object.values(ENTITY_TYPES),
  isMultiSelect: false,
  filters: []
}

export default MultiTypeAdvancedSelectComponent
