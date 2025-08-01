import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  AttachmentOverlayRow,
  AuthorizationGroupOverlayRow,
  EventOverlayRow,
  EventSeriesOverlayRow,
  LocationOverlayRow,
  OrganizationOverlayRow,
  PersonDetailedOverlayRow,
  PositionOverlayRow,
  ReportDetailedOverlayRow,
  TaskOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import Model from "components/Model"
import * as Models from "models"
import pluralize from "pluralize"
import React, { useCallback, useContext, useMemo, useState } from "react"
import { Button } from "react-bootstrap"
import COMMUNITIES_ICON from "resources/communities.png"
import EVENTS_ICON from "resources/events.png"
import EVENT_SERIES_ICON from "resources/eventSeries.png"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import REPORTS_ICON from "resources/reports.png"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

const entityFilters = {
  allEntities: {
    label: "All entities",
    queryVars: {}
  }
}

const peopleFilters = {
  allEntities: {
    label: "All",
    queryVars: { matchPositionName: true, pendingVerification: false }
  }
}

const widgetPropsReport = {
  objectType: Models.Report,
  overlayRenderRow: ReportDetailedOverlayRow,
  overlayColumns: [Settings.fields.report.intent?.label, "Author", "Updated"],
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
  fields: Models.Person.autocompleteQuery,
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

const generateLocationFilters = (filter, _) => {
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
  fields: Models.Location.autocompleteQuery,
  addon: LOCATIONS_ICON
}

const widgetPropsTask = {
  objectType: Models.Task,
  overlayRenderRow: TaskOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Task.autocompleteQuery,
  addon: TASKS_ICON
}

const widgetPropsAuthorizationGroup = {
  objectType: Models.AuthorizationGroup,
  overlayRenderRow: AuthorizationGroupOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.AuthorizationGroup.autocompleteQuery,
  addon: COMMUNITIES_ICON
}

const generateAttachmentFilters = (_, currentUser) => {
  return {
    myAttachments: {
      label: "My attachments",
      queryVars: {
        authorUuid: currentUser?.uuid
      }
    },
    allAttachments: {
      label: "All attachments",
      queryVars: {}
    }
  }
}

const widgetPropsAttachment = {
  objectType: Models.Attachment,
  overlayRenderRow: AttachmentOverlayRow,
  overlayColumns: ["Content", "Caption", "Uploaded"],
  filterDefs: generateAttachmentFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Attachment.autocompleteQuery,
  addon: <Icon icon={IconNames.PAPERCLIP} />
}

const widgetPropsEvent = {
  objectType: Models.Event,
  overlayRenderRow: EventOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.Event.autocompleteQuery,
  addon: EVENTS_ICON
}

const widgetPropsEventSeries = {
  objectType: Models.EventSeries,
  overlayRenderRow: EventSeriesOverlayRow,
  overlayColumns: ["Name"],
  filterDefs: entityFilters,
  queryParams: { status: Model.STATUS.ACTIVE },
  fields: Models.EventSeries.autocompleteQuery,
  addon: EVENT_SERIES_ICON
}

export const ENTITY_TYPES = {
  REPORTS: Models.Report.resourceName,
  PEOPLE: Models.Person.resourceName,
  ORGANIZATIONS: Models.Organization.resourceName,
  POSITIONS: Models.Position.resourceName,
  LOCATIONS: Models.Location.resourceName,
  TASKS: Models.Task.resourceName,
  AUTHORIZATION_GROUPS: Models.AuthorizationGroup.resourceName,
  ATTACHMENTS: Models.Attachment.resourceName,
  EVENTS: Models.Event.resourceName,
  EVENT_SERIES: Models.EventSeries.resourceName
}

const ENTITY_LABELS = {
  [ENTITY_TYPES.REPORTS]: "Reports",
  [ENTITY_TYPES.PEOPLE]: "People",
  [ENTITY_TYPES.ORGANIZATIONS]: "Organizations",
  [ENTITY_TYPES.POSITIONS]: "Positions",
  [ENTITY_TYPES.LOCATIONS]: "Locations",
  [ENTITY_TYPES.TASKS]: pluralize(Settings.fields.task.shortLabel),
  [ENTITY_TYPES.AUTHORIZATION_GROUPS]: "Communities",
  [ENTITY_TYPES.ATTACHMENTS]: "Attachments",
  [ENTITY_TYPES.EVENTS]: "Events",
  [ENTITY_TYPES.EVENT_SERIES]: "Event Series"
}

const widgetTypeMapping = {
  [ENTITY_TYPES.REPORTS]: widgetPropsReport,
  [ENTITY_TYPES.PEOPLE]: widgetPropsPeople,
  [ENTITY_TYPES.ORGANIZATIONS]: widgetPropsOrganization,
  [ENTITY_TYPES.POSITIONS]: widgetPropsPosition,
  [ENTITY_TYPES.LOCATIONS]: widgetPropsLocation,
  [ENTITY_TYPES.TASKS]: widgetPropsTask,
  [ENTITY_TYPES.AUTHORIZATION_GROUPS]: widgetPropsAuthorizationGroup,
  [ENTITY_TYPES.ATTACHMENTS]: widgetPropsAttachment,
  [ENTITY_TYPES.EVENTS]: widgetPropsEvent,
  [ENTITY_TYPES.EVENT_SERIES]: widgetPropsEventSeries
}

export const ALL_ENTITY_TYPES = Object.values(ENTITY_TYPES)
export const COMMON_ENTITY_TYPES = ALL_ENTITY_TYPES.filter(
  et => et !== ENTITY_TYPES.ATTACHMENTS
)

interface MultiTypeAdvancedSelectComponentProps {
  fieldName?: string
  onConfirm?: (...args: unknown[]) => unknown
  objectType?: string
  entityTypes: string[]
  value?: any | any[]
  valueKey?: string
  isMultiSelect: boolean
  filters?: any[]
  className?: string
}

const MultiTypeAdvancedSelectComponent = ({
  fieldName = "entitySelect",
  onConfirm,
  objectType,
  entityTypes = COMMON_ENTITY_TYPES,
  value,
  valueKey,
  isMultiSelect = false,
  filters = [],
  className
}: MultiTypeAdvancedSelectComponentProps) => {
  const { currentUser } = useContext(AppContext)
  const [entityType, setEntityType] = useState(
    objectType ||
      ALL_ENTITY_TYPES.find(et => entityTypes.includes(et)) ||
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
    const entityLabel = ENTITY_LABELS[ENTITY_TYPES[key]]
    return "Find " + entityLabel.toLowerCase()
  }, [entityType])
  const SelectComponent = isMultiSelect
    ? AdvancedMultiSelect
    : AdvancedSingleSelect
  const extraSelectProps = isMultiSelect ? {} : { showRemoveButton: false }
  const filterElement = filters?.find(f => f?.[entityType])?.[entityType] ?? {}
  const filterDefs =
    typeof advancedSelectProps.filterDefs === "function"
      ? advancedSelectProps.filterDefs(filterElement, currentUser)
      : { ...advancedSelectProps.filterDefs, ...filterElement }

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
              const entityLabel = ENTITY_LABELS[ENTITY_TYPES[key]]
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
        placeholder={searchPlaceholder}
        value={value}
        valueKey={valueKey}
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

export default MultiTypeAdvancedSelectComponent
