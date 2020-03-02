import { SEARCH_OBJECT_LABELS, SEARCH_OBJECT_TYPES } from "actions"
import { Settings } from "api"
import AdvancedSelectFilter, {
  deserialize as deserializeAdvancedSelectFilter
} from "components/advancedSearch/AdvancedSelectFilter"
import CheckboxFilter, {
  deserialize as deserializeCheckboxFilter
} from "components/advancedSearch/CheckboxFilter"
import DateRangeFilter, {
  deserialize as deserializeDateRangeFilter
} from "components/advancedSearch/DateRangeFilter"
import OrganizationFilter, {
  deserialize as deserializeOrganizationFilter
} from "components/advancedSearch/OrganizationFilter"
import ReportStateFilter, {
  deserialize as deserializeReportStateFilter
} from "components/advancedSearch/ReportStateFilter"
import SelectFilter, {
  deserialize as deserializeSelectFilter
} from "components/advancedSearch/SelectFilter"
import TextInputFilter, {
  deserialize as deserializeTextInputFilter
} from "components/advancedSearch/TextInputFilter"
import {
  LocationOverlayRow,
  PersonDetailedOverlayRow,
  PositionOverlayRow,
  TagOverlayRow,
  TaskSimpleOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import _isEmpty from "lodash/isEmpty"
import {
  Location,
  Organization,
  Person,
  Position,
  Report,
  Tag,
  Task
} from "models"
import PropTypes from "prop-types"
import React from "react"
import LOCATIONS_ICON from "resources/locations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"

export const SearchQueryPropType = PropTypes.shape({
  text: PropTypes.string,
  filters: PropTypes.any,
  objectType: PropTypes.string
})

export const getSearchQuery = searchQuery => {
  const query = {}
  if (!_isEmpty(searchQuery.text)) {
    query.text = searchQuery.text
  }
  if (searchQuery.filters) {
    searchQuery.filters.forEach(filter => {
      if (filter.value) {
        if (filter.value.toQuery) {
          const toQuery =
            typeof filter.value.toQuery === "function"
              ? filter.value.toQuery()
              : filter.value.toQuery
          Object.assign(query, toQuery)
        } else {
          query[filter.key] = filter.value
        }
      }
    })
  }
  return query
}

export const POSTITION_POSITION_TYPE_FILTER_KEY = "Position Type"

export const RECURSE_STRATEGY = {
  NONE: "NONE",
  CHILDREN: "CHILDREN",
  PARENTS: "PARENTS"
}

const taskFilters = () => {
  const taskFiltersObj = {
    Organization: {
      component: OrganizationFilter,
      deserializer: deserializeOrganizationFilter,
      props: {
        queryKey: "taskedOrgUuid",
        queryOrgRecurseStrategyKey: "orgRecurseStrategy"
      }
    },
    Status: {
      component: SelectFilter,
      deserializer: deserializeSelectFilter,
      props: {
        queryKey: "status",
        options: [Task.STATUS.ACTIVE, Task.STATUS.INACTIVE],
        labels: ["Active", "Inactive"]
      }
    }
  }
  const projectedCompletion = Settings.fields.task.projectedCompletion
  if (projectedCompletion) {
    taskFiltersObj[projectedCompletion.label] = {
      component: DateRangeFilter,
      deserializer: deserializeDateRangeFilter,
      props: {
        queryKey: "projectedCompletion"
      }
    }
  }
  const plannedCompletion = Settings.fields.task.plannedCompletion
  if (plannedCompletion) {
    taskFiltersObj[plannedCompletion.label] = {
      component: DateRangeFilter,
      deserializer: deserializeDateRangeFilter,
      props: {
        queryKey: "plannedCompletion"
      }
    }
  }
  const customEnum1 = Settings.fields.task.customFieldEnum1
  if (customEnum1) {
    taskFiltersObj[customEnum1.label] = {
      component: SelectFilter,
      deserializer: deserializeSelectFilter,
      props: {
        queryKey: "projectStatus",
        options: Object.keys(customEnum1.enum),
        labels: Object.values(customEnum1.enum).map(o => o.label)
      }
    }
  }
  const customField = Settings.fields.task.customField
  if (customField) {
    taskFiltersObj[customField.label] = {
      component: TextInputFilter,
      deserializer: deserializeTextInputFilter,
      props: {
        queryKey: "customField"
      }
    }
  }

  return taskFiltersObj
}

const advancedSelectFilterPersonProps = {
  overlayColumns: ["Name", "Position", "Location", "Organization"],
  overlayRenderRow: PersonDetailedOverlayRow,
  objectType: Person,
  valueKey: "name",
  fields: Person.autocompleteQuery,
  addon: PEOPLE_ICON
}
const advancedSelectFilterPositionProps = {
  overlayColumns: ["Position", "Organization", "Current Occupant"],
  overlayRenderRow: PositionOverlayRow,
  objectType: Position,
  valueKey: "name",
  fields: Position.autocompleteQuery,
  addon: POSITIONS_ICON
}
const advancedSelectFilterLocationProps = {
  overlayColumns: ["Name"],
  overlayRenderRow: LocationOverlayRow,
  objectType: Location,
  valueKey: "name",
  fields: Location.autocompleteQuery,
  addon: LOCATIONS_ICON
}
const advancedSelectFilterTaskProps = {
  overlayColumns: ["Name"],
  overlayRenderRow: TaskSimpleOverlayRow,
  objectType: Task,
  valueKey: "shortName",
  fields: Task.autocompleteQuery,
  addon: TASKS_ICON
}

const searchFilters = function() {
  const filters = {}
  const subscriptionFilter = {
    Subscribed: {
      component: CheckboxFilter,
      deserializer: deserializeCheckboxFilter,
      props: {
        queryKey: "subscribed",
        msg: "By me"
      }
    }
  }

  const taskShortLabel = Settings.fields.task.shortLabel
  const authorWidgetFilters = {
    all: {
      label: "All",
      queryVars: { role: Person.ROLE.ADVISOR }
    }
  }
  const attendeeWidgetFilters = {
    all: {
      label: "All",
      queryVars: {}
    }
  }
  const pendingApprovalOfWidgetFilters = authorWidgetFilters
  const authorPositionWidgetFilters = {
    all: {
      label: "All",
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
      queryVars: {}
    }
  }
  const locationWidgetFilters = {
    all: {
      label: "All",
      queryVars: {}
    }
  }

  const taskWidgetFilters = {
    all: {
      label: "All",
      queryVars: {}
    }
  }

  const tagWidgetFilters = {
    all: {
      label: "All",
      queryVars: {}
    }
  }

  filters[SEARCH_OBJECT_TYPES.REPORTS] = {
    filters: {
      Author: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterPersonProps, {
          filterDefs: authorWidgetFilters,
          placeholder: "Filter reports by author...",
          queryKey: "authorUuid"
        })
      },
      Attendee: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterPersonProps, {
          filterDefs: attendeeWidgetFilters,
          placeholder: "Filter reports by attendee...",
          queryKey: "attendeeUuid"
        })
      },
      "Pending Approval Of": {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterPersonProps, {
          filterDefs: pendingApprovalOfWidgetFilters,
          placeholder: "Filter reports pending approval of...",
          queryKey: "pendingApprovalOf"
        })
      },
      "Author Position": {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterPositionProps, {
          filterDefs: authorPositionWidgetFilters,
          placeholder: "Filter reports by author position...",
          queryKey: "authorPositionUuid"
        })
      },
      "Attendee Position": {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterPositionProps, {
          filterDefs: attendeePositionWidgetFilters,
          placeholder: "Filter reports by attendee position...",
          queryKey: "attendeePositionUuid"
        })
      },
      Organization: {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "orgUuid",
          queryOrgRecurseStrategyKey: "orgRecurseStrategy"
        }
      },
      "Engagement Date": {
        component: DateRangeFilter,
        deserializer: deserializeDateRangeFilter,
        props: {
          queryKey: "engagementDate"
        }
      },
      "Release Date": {
        component: DateRangeFilter,
        deserializer: deserializeDateRangeFilter,
        props: {
          queryKey: "releasedAt"
        }
      },
      "Creation Date": {
        component: DateRangeFilter,
        deserializer: deserializeDateRangeFilter,
        props: {
          queryKey: "createdAt"
        }
      },
      "Update Date": {
        component: DateRangeFilter,
        deserializer: deserializeDateRangeFilter,
        props: {
          queryKey: "updatedAt"
        }
      },
      Location: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterLocationProps, {
          filterDefs: locationWidgetFilters,
          placeholder: "Filter reports by location...",
          queryKey: "locationUuid"
        })
      },
      State: {
        component: ReportStateFilter,
        deserializer: deserializeReportStateFilter,
        props: {
          queryKey: "state"
        }
      },
      "Engagement Status": {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "engagementStatus",
          options: [
            Report.ENGAGEMENT_STATUS.HAPPENED,
            Report.ENGAGEMENT_STATUS.FUTURE,
            Report.ENGAGEMENT_STATUS.CANCELLED
          ]
        }
      },
      [Settings.fields.report.atmosphere]: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "atmosphere",
          options: ["POSITIVE", "NEUTRAL", "NEGATIVE"]
        }
      },
      Tag: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: {
          overlayColumns: ["Name"],
          overlayRenderRow: TagOverlayRow,
          objectType: Tag,
          valueKey: "name",
          fields: Tag.autocompleteQuery,
          filterDefs: tagWidgetFilters,
          placeholder: "Filter reports by tag...",
          queryKey: "tagUuid"
        }
      },
      "Sensitive Info": {
        component: CheckboxFilter,
        deserializer: deserializeCheckboxFilter,
        props: {
          queryKey: "sensitiveInfo"
        }
      },
      [taskShortLabel]: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterTaskProps, {
          filterDefs: taskWidgetFilters,
          placeholder: `Filter reports by ${taskShortLabel}...`,
          queryKey: "taskUuid"
        })
      },
      ...subscriptionFilter
    }
  }

  const countries = Settings.fields.advisor.person.countries || [] // TODO: make search also work with principal countries
  const ranks = (Settings.fields.person.ranks || []).map(f => f.value)
  filters[SEARCH_OBJECT_TYPES.PEOPLE] = {
    filters: {
      Organization: {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "orgUuid",
          queryOrgRecurseStrategyKey: "orgRecurseStrategy"
        }
      },
      Role: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "role",
          options: [Person.ROLE.ADVISOR, Person.ROLE.PRINCIPAL],
          labels: [
            Settings.fields.advisor.person.name,
            Settings.fields.principal.person.name
          ]
        }
      },
      Status: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "status",
          options: [
            Person.STATUS.ACTIVE,
            Person.STATUS.INACTIVE,
            Person.STATUS.NEW_USER
          ]
        }
      },
      Location: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterLocationProps, {
          filterDefs: locationWidgetFilters,
          placeholder: "Filter by location...",
          queryKey: "locationUuid"
        })
      },
      Rank: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "rank",
          options: ranks,
          labels: ranks
        }
      },
      Nationality: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "country",
          options: countries,
          labels: countries
        }
      },
      "Has Biography?": {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "hasBiography",
          options: ["true", "false"],
          labels: ["Yes", "No"]
        }
      },
      ...subscriptionFilter
    }
  }

  filters[SEARCH_OBJECT_TYPES.ORGANIZATIONS] = {
    filters: {
      Status: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "status",
          options: [Organization.STATUS.ACTIVE, Organization.STATUS.INACTIVE]
        }
      },
      "Organization Type": {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "type",
          options: [
            Organization.TYPE.ADVISOR_ORG,
            Organization.TYPE.PRINCIPAL_ORG
          ],
          labels: [
            Settings.fields.advisor.org.name,
            Settings.fields.principal.org.name
          ]
        }
      },
      ...subscriptionFilter
    }
  }

  filters[SEARCH_OBJECT_TYPES.POSITIONS] = {
    filters: {
      [POSTITION_POSITION_TYPE_FILTER_KEY]: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "type",
          options: [Position.TYPE.ADVISOR, Position.TYPE.PRINCIPAL],
          labels: [
            Settings.fields.advisor.position.name,
            Settings.fields.principal.position.name
          ],
          isPositionTypeFilter: true
        }
      },
      Organization: {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "organizationUuid",
          queryOrgRecurseStrategyKey: "orgRecurseStrategy"
        }
      },
      Status: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "status",
          options: [Position.STATUS.ACTIVE, Position.STATUS.INACTIVE]
        }
      },
      Location: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterLocationProps, {
          filterDefs: locationWidgetFilters,
          placeholder: "Filter by location...",
          queryKey: "locationUuid"
        })
      },
      "Is Filled?": {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "isFilled",
          options: ["true", "false"],
          labels: ["Yes", "No"]
        }
      },
      ...subscriptionFilter
    }
  }

  filters[SEARCH_OBJECT_TYPES.LOCATIONS] = {
    filters: {
      Status: {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "status",
          options: [Location.STATUS.ACTIVE, Location.STATUS.INACTIVE]
        }
      },
      ...subscriptionFilter
    }
  }

  // Task filters
  filters[SEARCH_OBJECT_TYPES.TASKS] = {
    filters: taskFilters(),
    ...subscriptionFilter
  }

  return filters
}

// filters not being displayed in the advanced search but being used in the search
const extraFilters = function() {
  const filters = {}
  filters[SEARCH_OBJECT_TYPES.REPORTS] = [
    "includeEngagementDayOfWeek",
    "sortOrder"
  ]
  return filters
}

const SearchFilterDisplay = ({ filter, element, showSeparator }) => {
  const label = filter.key
  const ChildComponent = element.component
  const sep = showSeparator ? ", " : ""
  return (
    <>
      <b>{label}</b>:{" "}
      <em>
        <ChildComponent
          value={filter.value || ""}
          asFormField={false}
          {...element.props}
        />
      </em>
      {sep}
    </>
  )
}

SearchFilterDisplay.propTypes = {
  filter: PropTypes.object,
  element: PropTypes.shape({
    component: PropTypes.func.isRequired,
    props: PropTypes.object
  }),
  showSeparator: PropTypes.bool
}

export const SearchDescription = ({ searchQuery, showPlaceholders }) => {
  const ALL_FILTERS = searchFilters()
  const filterDefs =
    searchQuery.objectType && SEARCH_OBJECT_TYPES[searchQuery.objectType]
      ? ALL_FILTERS[SEARCH_OBJECT_TYPES[searchQuery.objectType]].filters
      : {}
  const filters = searchQuery.filters.filter(f => filterDefs[f.key])
  return (
    <span className="asLink">
      {searchQuery.objectType ? (
        <>
          <b>{SEARCH_OBJECT_LABELS[searchQuery.objectType]}</b>
          {filters.length > 0 ? (
            <>
              <> filtered on </>
              {filters.map(
                (filter, i) =>
                  filterDefs[filter.key] && (
                    <SearchFilterDisplay
                      key={filter.key}
                      filter={filter}
                      element={filterDefs[filter.key]}
                      showSeparator={i !== filters.length - 1}
                    />
                  )
              )}
            </>
          ) : (
            showPlaceholders && " - add filters"
          )}
        </>
      ) : (
        showPlaceholders && "Add filters"
      )}
    </span>
  )
}

SearchDescription.propTypes = {
  searchQuery: SearchQueryPropType,
  showPlaceholders: PropTypes.bool
}

export default { searchFilters, extraFilters }
