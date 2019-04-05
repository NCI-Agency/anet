import { Settings } from "api"
import AdvancedSelectFilter from "components/advancedSearch/AdvancedSelectFilter"
import AutocompleteFilter from "components/advancedSearch/AutocompleteFilter"
import CheckboxSearchFilter from "components/advancedSearch/CheckboxSearchFilter"
import DateRangeSearch from "components/advancedSearch/DateRangeSearch"
import OrganizationFilter from "components/advancedSearch/OrganizationFilter"
import PositionTypeSearchFilter from "components/advancedSearch/PositionTypeSearchFilter"
import ReportStateSearch from "components/advancedSearch/ReportStateSearch"
import SelectSearchFilter from "components/advancedSearch/SelectSearchFilter"
import TextInputFilter from "components/advancedSearch/TextInputFilter"
import LinkTo from "components/LinkTo"
import { Location, Organization, Person, Position, Tag, Task } from "models"
import pluralize from "pluralize"
import React from "react"
import LOCATIONS_ICON from "resources/locations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"

export const POSTITION_POSITION_TYPE_FILTER_KEY = "Position Type"
export const POSTITION_ORGANIZATION_FILTER_KEY = "Organization"

const taskFilters = props => {
  const taskFiltersObj = {
    Organization: {
      component: OrganizationFilter,
      props: {
        queryKey: "responsibleOrgUuid",
        queryIncludeChildOrgsKey: "includeChildrenOrgs"
      }
    },
    Status: {
      component: SelectSearchFilter,
      props: {
        queryKey: "status",
        values: [Task.STATUS.ACTIVE, Task.STATUS.INACTIVE],
        labels: ["Active", "Inactive"]
      }
    }
  }
  const projectedCompletion = Settings.fields.task.projectedCompletion
  if (projectedCompletion) {
    taskFiltersObj[projectedCompletion.label] = {
      component: DateRangeSearch,
      props: {
        queryKey: "projectedCompletion"
      }
    }
  }
  const plannedCompletion = Settings.fields.task.plannedCompletion
  if (plannedCompletion) {
    taskFiltersObj[plannedCompletion.label] = {
      component: DateRangeSearch,
      props: {
        queryKey: "plannedCompletion"
      }
    }
  }
  const customEnum1 = Settings.fields.task.customFieldEnum1
  if (customEnum1) {
    taskFiltersObj[customEnum1.label] = {
      component: SelectSearchFilter,
      props: {
        queryKey: "projectStatus",
        values: Object.keys(customEnum1.enum),
        labels: Object.values(customEnum1.enum)
      }
    }
  }
  const customField = Settings.fields.task.customField
  if (customField) {
    taskFiltersObj[customField.label] = {
      component: TextInputFilter,
      props: {
        queryKey: "customField"
      }
    }
  }

  return taskFiltersObj
}

const renderPersonOverlayRow = item => {
  return (
    <React.Fragment key={item.uuid}>
      <td>
        <LinkTo person={item} isLink={false} />
      </td>
      <td>
        <LinkTo position={item.position} isLink={false} />
        {item.position && item.position.code ? `, ${item.position.code}` : ""}
      </td>
      <td>
        <LinkTo
          whenUnspecified=""
          anetLocation={item.position && item.position.location}
          isLink={false}
        />
      </td>
      <td>
        {item.position && item.position.organization && (
          <LinkTo organization={item.position.organization} isLink={false} />
        )}
      </td>
    </React.Fragment>
  )
}

const renderPositionOverlayRow = item => {
  return (
    <React.Fragment key={item.uuid}>
      <td>
        <LinkTo person={item.person} isLink={false} />
      </td>
      <td>
        <LinkTo position={item} isLink={false} />
      </td>
    </React.Fragment>
  )
}

const renderLocationOverlayRow = item => {
  return (
    <React.Fragment key={item.uuid}>
      <td>
        <LinkTo anetLocation={item} isLink={false} />
      </td>
    </React.Fragment>
  )
}

const renderTaskOverlayRow = item => {
  return (
    <React.Fragment key={item.uuid}>
      <td className="taskName">
        <LinkTo task={item} isLink={false}>
          {item.shortName} - {item.longName}
        </LinkTo>
      </td>
    </React.Fragment>
  )
}

const advancedSelectFilterPersonProps = {
  overlayColumns: ["Name", "Position", "Location", "Organization"],
  overlayRenderRow: renderPersonOverlayRow,
  objectType: Person,
  valueKey: "name",
  fields: Person.autocompleteQuery,
  addon: PEOPLE_ICON
}
const advancedSelectFilterPositionProps = {
  overlayColumns: ["Name", "Position", "Location", "Organization"],
  overlayRenderRow: renderPositionOverlayRow,
  objectType: Position,
  valueKey: "name",
  fields: Position.autocompleteQuery,
  addon: POSITIONS_ICON
}
const advancedSelectFilterLocationProps = {
  overlayColumns: ["Location", "Name"],
  overlayRenderRow: renderLocationOverlayRow,
  objectType: Location,
  valueKey: "name",
  fields: Location.autocompleteQuery,
  addon: LOCATIONS_ICON
}
const advancedSelectFilterTaskProps = {
  overlayColumns: ["Name"],
  overlayRenderRow: renderTaskOverlayRow,
  objectType: Task,
  valueKey: "shortName",
  fields: Task.autocompleteQuery,
  addon: TASKS_ICON
}

export default {
  searchFilters: function(positionTypeFilterRef, organizationFilterRef) {
    const filters = {}
    const authorWidgetFilters = {
      all: {
        label: "All",
        searchQuery: true,
        queryVars: { role: Person.ROLE.ADVISOR }
      }
    }
    const attendeeWidgetFilters = {
      all: {
        label: "All",
        searchQuery: true,
        queryVars: {}
      }
    }
    const pendingApprovalOfWidgetFilters = authorWidgetFilters
    const authorPositionWidgetFilters = {
      all: {
        label: "All",
        searchQuery: true,
        queryVars: {
          type: [
            Position.TYPE.ADVISOR,
            Position.TYPE.SUPER_USER,
            Position.TYPE.ADMINISTRATOR
          ]
        }
      }
    }
    const attendeePositionWidgetFilters = {
      all: {
        label: "All",
        searchQuery: true,
        queryVars: {}
      }
    }
    const locationWidgetFilters = {
      all: {
        label: "All",
        searchQuery: true,
        queryVars: {}
      }
    }

    const taskWidgetFilters = {
      all: {
        label: "All",
        searchQuery: true,
        queryVars: {}
      }
    }

    filters.Reports = {
      filters: {
        Author: {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterPersonProps, {
            fieldName: "author",
            filterDefs: authorWidgetFilters,
            placeholder: "Filter reports by author...",
            queryKey: "authorUuid"
          })
        },
        Attendee: {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterPersonProps, {
            fieldName: "attendee",
            filterDefs: attendeeWidgetFilters,
            placeholder: "Filter reports by attendee...",
            queryKey: "attendeeUuid"
          })
        },
        "Pending Approval Of": {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterPersonProps, {
            fieldName: "pendingApprovalOf",
            filterDefs: pendingApprovalOfWidgetFilters,
            placeholder: "Filter reports pending approval of...",
            queryKey: "pendingApprovalOf"
          })
        },
        "Author Position": {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterPositionProps, {
            fieldName: "authorPosition",
            filterDefs: authorPositionWidgetFilters,
            placeholder: "Filter reports by author position...",
            queryKey: "authorPositionUuid"
          })
        },
        "Attendee Position": {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterPositionProps, {
            fieldName: "attendeePosition",
            filterDefs: attendeePositionWidgetFilters,
            placeholder: "Filter reports by attendee position...",
            queryKey: "attendeePositionUuid"
          })
        },
        Organization: {
          component: OrganizationFilter,
          props: {
            queryKey: "orgUuid",
            queryIncludeChildOrgsKey: "includeOrgChildren"
          }
        },
        "Engagement Date": {
          component: DateRangeSearch,
          props: {
            queryKey: "engagementDate"
          }
        },
        "Release Date": {
          component: DateRangeSearch,
          props: {
            queryKey: "releasedAt"
          }
        },
        "Creation Date": {
          component: DateRangeSearch,
          props: {
            queryKey: "createdAt"
          }
        },
        "Update Date": {
          component: DateRangeSearch,
          props: {
            queryKey: "updatedAt"
          }
        },
        Location: {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterLocationProps, {
            fieldName: "location",
            filterDefs: locationWidgetFilters,
            placeholder: "Filter reports by location...",
            queryKey: "locationUuid"
          })
        },
        State: {
          component: ReportStateSearch
        },
        [Settings.fields.report.atmosphere]: {
          component: SelectSearchFilter,
          props: {
            queryKey: "atmosphere",
            values: ["POSITIVE", "NEUTRAL", "NEGATIVE"]
          }
        },
        Tag: {
          component: AutocompleteFilter,
          props: {
            queryKey: "tagUuid",
            objectType: Tag,
            valueKey: "name",
            fields: Tag.autocompleteQuery,
            placeholder: "Filter reports by tag..."
          }
        },
        "Sensitive Info": {
          component: CheckboxSearchFilter,
          props: {
            queryKey: "sensitiveInfo"
          }
        }
      }
    }

    const taskShortLabel = Settings.fields.task.shortLabel
    filters.Reports.filters[taskShortLabel] = {
      component: AdvancedSelectFilter,
      props: Object.assign({}, advancedSelectFilterTaskProps, {
        fieldName: "task",
        filterDefs: taskWidgetFilters,
        placeholder: `Filter reports by ${taskShortLabel}...`,
        queryKey: "taskUuid"
      })
    }

    const countries = Settings.fields.advisor.person.countries || [] // TODO: make search also work with principal countries
    const ranks = Settings.fields.person.ranks || []

    filters.People = {
      filters: {
        Organization: {
          component: OrganizationFilter,
          props: {
            queryKey: "orgUuid",
            queryIncludeChildOrgsKey: "includeChildOrgs"
          }
        },
        Role: {
          component: SelectSearchFilter,
          props: {
            queryKey: "role",
            values: [Person.ROLE.ADVISOR, Person.ROLE.PRINCIPAL],
            labels: [
              Settings.fields.advisor.person.name,
              Settings.fields.principal.person.name
            ]
          }
        },
        Status: {
          component: SelectSearchFilter,
          props: {
            queryKey: "status",
            values: [
              Person.STATUS.ACTIVE,
              Person.STATUS.INACTIVE,
              Person.STATUS.NEW_USER
            ]
          }
        },
        Location: {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterLocationProps, {
            fieldName: "location",
            filterDefs: locationWidgetFilters,
            placeholder: "Filter by location...",
            queryKey: "locationUuid"
          })
        },
        Rank: {
          component: SelectSearchFilter,
          props: {
            queryKey: "rank",
            values: ranks,
            labels: ranks
          }
        },
        Nationality: {
          component: SelectSearchFilter,
          props: {
            queryKey: "country",
            values: countries,
            labels: countries
          }
        }
      }
    }

    filters.Organizations = {
      filters: {
        Status: {
          component: SelectSearchFilter,
          props: {
            queryKey: "status",
            values: [Organization.STATUS.ACTIVE, Organization.STATUS.INACTIVE]
          }
        },
        "Organization Type": {
          component: SelectSearchFilter,
          props: {
            queryKey: "type",
            values: [
              Organization.TYPE.ADVISOR_ORG,
              Organization.TYPE.PRINCIPAL_ORG
            ],
            labels: [
              Settings.fields.advisor.org.name,
              Settings.fields.principal.org.name
            ]
          }
        }
      }
    }

    filters.Positions = {
      filters: {
        [POSTITION_POSITION_TYPE_FILTER_KEY]: {
          component: PositionTypeSearchFilter,
          props: {
            queryKey: "type",
            values: [Position.TYPE.ADVISOR, Position.TYPE.PRINCIPAL],
            labels: [
              Settings.fields.advisor.position.name,
              Settings.fields.principal.position.name
            ],
            ref: positionTypeFilterRef
          }
        },
        [POSTITION_ORGANIZATION_FILTER_KEY]: {
          component: OrganizationFilter,
          props: {
            queryKey: "organizationUuid",
            queryIncludeChildOrgsKey: "includeChildrenOrgs",
            ref: organizationFilterRef
          }
        },
        Status: {
          component: SelectSearchFilter,
          props: {
            queryKey: "status",
            values: [Position.STATUS.ACTIVE, Position.STATUS.INACTIVE]
          }
        },
        Location: {
          component: AdvancedSelectFilter,
          props: Object.assign({}, advancedSelectFilterLocationProps, {
            fieldName: "location",
            filterDefs: locationWidgetFilters,
            placeholder: "Filter by location...",
            queryKey: "locationUuid"
          })
        },
        "Is Filled?": {
          component: SelectSearchFilter,
          props: {
            queryKey: "isFilled",
            values: ["true", "false"],
            labels: ["Yes", "No"]
          }
        }
      }
    }

    filters.Locations = {
      filters: {
        Status: {
          component: SelectSearchFilter,
          props: {
            queryKey: "status",
            values: [Location.STATUS.ACTIVE, Location.STATUS.INACTIVE]
          }
        }
      }
    }

    // Task filters
    filters[pluralize(taskShortLabel)] = {
      filters: taskFilters()
    }

    return filters
  },
  // filters not being displayed in the advanced search but being used in the search
  extraFilters: function(positionTypeFilterRef, organizationFilterRef) {
    const filters = {}
    filters.Reports = ["includeEngagementDayOfWeek", "sortOrder"]
    return filters
  }
}
