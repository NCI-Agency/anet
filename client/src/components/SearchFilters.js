import { SEARCH_OBJECT_LABELS, SEARCH_OBJECT_TYPES } from "actions"
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
import RadioButtonFilter, {
  deserialize as deserializeRadioButtonFilter
} from "components/advancedSearch/RadioButtonFilter"
import ReportStateFilter, {
  deserialize as deserializeReportStateFilter
} from "components/advancedSearch/ReportStateFilter"
import SelectFilter, {
  deserialize as deserializeSelectFilter
} from "components/advancedSearch/SelectFilter"
import TaskFilter, {
  deserialize as deserializeTaskFilter
} from "components/advancedSearch/TaskFilter"
import {
  LocationOverlayRow,
  PersonDetailedOverlayRow,
  PositionOverlayRow,
  TaskOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import { getBreadcrumbTrailAsText } from "components/BreadcrumbTrail"
import Model from "components/Model"
import DictionaryField from "HOC/DictionaryField"
import _isEmpty from "lodash/isEmpty"
import _pickBy from "lodash/pickBy"
import { Location, Organization, Person, Position, Report, Task } from "models"
import PropTypes from "prop-types"
import React from "react"
import LOCATIONS_ICON from "resources/locations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"
import {
  POSITION_POSITION_TYPE_FILTER_KEY,
  RECURSE_STRATEGY
} from "searchUtils"
import Settings from "settings"

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

const StatusFilter = {
  component: SelectFilter,
  deserializer: deserializeSelectFilter,
  isDefault: true,
  props: {
    queryKey: "status",
    options: [Model.STATUS.ACTIVE, Model.STATUS.INACTIVE]
  }
}

const SubscriptionFilter = {
  component: CheckboxFilter,
  deserializer: deserializeCheckboxFilter,
  props: {
    queryKey: "subscribed",
    msg: "By me"
  }
}

const advancedSelectFilterPersonProps = {
  overlayColumns: ["Name", "Position", "Location", "Organization"],
  overlayRenderRow: PersonDetailedOverlayRow,
  objectType: Person,
  valueKey: "name",
  queryParams: {
    pendingVerification: false
  },
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
  overlayRenderRow: TaskOverlayRow,
  objectType: Task,
  valueKey: "shortName",
  valueFunc: (v, k) =>
    getBreadcrumbTrailAsText(v, v?.ascendantTasks, "parentTask", k),
  fields: Task.autocompleteQuery,
  addon: TASKS_ICON
}

export const searchFilters = function() {
  const filters = {}

  const taskShortLabel = Settings.fields.task.shortLabel
  const authorWidgetFilters = {
    all: {
      label: "All",
      queryVars: { role: Person.ROLE.ADVISOR, pendingVerification: false }
    }
  }
  const attendeeWidgetFilters = {
    all: {
      label: "All",
      queryVars: { pendingVerification: false }
    }
  }
  const pendingApprovalOfWidgetFilters = authorWidgetFilters
  const authorPositionWidgetFilters = {
    all: {
      label: "All",
      queryVars: {
        type: [
          Position.TYPE.ADVISOR,
          Position.TYPE.SUPERUSER,
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
      "Within Organization": {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "orgUuid",
          queryRecurseStrategyKey: "orgRecurseStrategy",
          fixedRecurseStrategy: RECURSE_STRATEGY.CHILDREN
        }
      },
      "Engagement Date": {
        component: DateRangeFilter,
        dictProps: Settings.fields.report.engagementDate,
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
        dictProps: Settings.fields.report.location,
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
      Atmospherics: {
        component: SelectFilter,
        dictProps: Settings.fields.report.atmosphere,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "atmosphere",
          options: [
            Report.ATMOSPHERE.POSITIVE,
            Report.ATMOSPHERE.NEUTRAL,
            Report.ATMOSPHERE.NEGATIVE
          ]
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
      }
    }
  }

  const countries = Settings.fields.advisor.person.countries || [] // TODO: make search also work with principal countries
  const ranks = (Settings.fields.person.ranks || []).map(f => f.value)

  filters[SEARCH_OBJECT_TYPES.PEOPLE] = {
    filters: {
      "Within Organization": {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "orgUuid",
          queryRecurseStrategyKey: "orgRecurseStrategy",
          fixedRecurseStrategy: RECURSE_STRATEGY.CHILDREN
        }
      },
      Role: {
        component: SelectFilter,
        dictProps: Settings.fields.person.role,
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
        dictProps: Settings.fields.person.rank,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "rank",
          options: ranks,
          labels: ranks
        }
      },
      Nationality: {
        component: SelectFilter,
        dictProps: Settings.fields.person.country,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "country",
          options: countries,
          labels: countries
        }
      },
      "Has Biography?": {
        component: RadioButtonFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "hasBiography",
          options: [true, false],
          labels: ["Yes", "No"]
        }
      },
      "Pending Verification": {
        component: RadioButtonFilter,
        deserializer: deserializeSelectFilter,
        isDefault: true,
        props: {
          queryKey: "pendingVerification",
          options: [true, false],
          defaultOption: false,
          labels: ["Yes", "No"]
        }
      }
    }
  }

  filters[SEARCH_OBJECT_TYPES.ORGANIZATIONS] = {
    filters: {
      "Organization Type": {
        component: SelectFilter,
        dictProps: Settings.fields.organization.type,
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
      "Within Organization": {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "parentOrgUuid",
          queryRecurseStrategyKey: "orgRecurseStrategy",
          fixedRecurseStrategy: RECURSE_STRATEGY.CHILDREN
        }
      },
      Location: {
        component: AdvancedSelectFilter,
        dictProps: Settings.fields.organization.location,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterLocationProps, {
          filterDefs: locationWidgetFilters,
          placeholder: "Filter by location...",
          queryKey: "locationUuid"
        })
      },
      [`Has ${Settings.fields.organization.profile?.label}?`]: {
        component: RadioButtonFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "hasProfile",
          options: [true, false],
          labels: ["Yes", "No"]
        }
      }
    }
  }

  filters[SEARCH_OBJECT_TYPES.POSITIONS] = {
    filters: {
      [POSITION_POSITION_TYPE_FILTER_KEY]: {
        component: SelectFilter,
        dictProps: Settings.fields.position.type,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "type",
          options: [
            Position.TYPE.PRINCIPAL,
            Position.TYPE.ADVISOR,
            Position.TYPE.SUPERUSER,
            Position.TYPE.ADMINISTRATOR
          ],
          labels: [
            Settings.fields.principal.position.name,
            Settings.fields.advisor.position.name,
            Settings.fields.superuser.position.name,
            Settings.fields.administrator.position.name
          ],
          isPositionTypeFilter: true
        }
      },
      "Within Organization": {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "organizationUuid",
          queryRecurseStrategyKey: "orgRecurseStrategy",
          fixedRecurseStrategy: RECURSE_STRATEGY.CHILDREN
        }
      },
      Location: {
        component: AdvancedSelectFilter,
        dictProps: Settings.fields.position.location,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterLocationProps, {
          filterDefs: locationWidgetFilters,
          placeholder: "Filter by location...",
          queryKey: "locationUuid"
        })
      },
      "Is Filled?": {
        component: RadioButtonFilter,
        deserializer: deserializeRadioButtonFilter,
        props: {
          queryKey: "isFilled",
          options: [true, false],
          labels: ["Yes", "No"]
        }
      },
      "Has Pending Assessments": {
        component: CheckboxFilter,
        deserializer: deserializeCheckboxFilter,
        props: {
          queryKey: "hasPendingAssessments",
          msg: "Yes"
        }
      }
    }
  }

  const locationTypeOptions = [
    Location.LOCATION_TYPES.ADVISOR_LOCATION,
    Location.LOCATION_TYPES.PRINCIPAL_LOCATION,
    Location.LOCATION_TYPES.POINT_LOCATION,
    Location.LOCATION_TYPES.GEOGRAPHICAL_AREA,
    Location.LOCATION_TYPES.VIRTUAL_LOCATION
  ]
  filters[SEARCH_OBJECT_TYPES.LOCATIONS] = {
    filters: {
      "Location Type": {
        component: SelectFilter,
        dictProps: Settings.fields.location.type,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "type",
          options: locationTypeOptions,
          labels: locationTypeOptions.map(lt => Location.humanNameOfType(lt))
        }
      }
    }
  }

  filters[SEARCH_OBJECT_TYPES.TASKS] = {
    filters: {
      "Within Organization": {
        component: OrganizationFilter,
        deserializer: deserializeOrganizationFilter,
        props: {
          queryKey: "taskedOrgUuid",
          queryRecurseStrategyKey: "orgRecurseStrategy",
          fixedRecurseStrategy: RECURSE_STRATEGY.CHILDREN
        }
      },
      [`Within ${Settings.fields.task.shortLabel}`]: {
        component: TaskFilter,
        deserializer: deserializeTaskFilter,
        props: {
          queryKey: "parentTaskUuid",
          queryRecurseStrategyKey: "parentTaskRecurseStrategy",
          fixedRecurseStrategy: RECURSE_STRATEGY.CHILDREN
        }
      },
      "Projected Completion": {
        component: DateRangeFilter,
        dictProps: Settings.fields.task.projectedCompletion,
        deserializer: deserializeDateRangeFilter,
        props: {
          queryKey: "projectedCompletion"
        }
      },
      "Planned Completion": {
        component: DateRangeFilter,
        dictProps: Settings.fields.task.plannedCompletion,
        deserializer: deserializeDateRangeFilter,
        props: {
          queryKey: "plannedCompletion"
        }
      }
    }
  }

  for (const filtersForType of Object.values(filters)) {
    filtersForType.filters.Status = StatusFilter
    filtersForType.filters.Subscribed = SubscriptionFilter
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
  const dictProps = element.dictProps
  const label = dictProps?.label || filter.key
  const ChildComponent = dictProps
    ? DictionaryField(element.component)
    : element.component
  const additionalProps = dictProps ? { dictProps } : {}
  const sep = showSeparator ? ", " : ""
  return dictProps?.exclude ? null : (
    <>
      <b>{label}</b>:{" "}
      <em>
        <ChildComponent
          value={filter.value || ""}
          asFormField={false}
          {...additionalProps}
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
    dictProps: PropTypes.object,
    props: PropTypes.object
  }),
  showSeparator: PropTypes.bool
}

export const SearchDescription = ({ searchQuery, showPlaceholders }) => {
  const ALL_FILTERS = searchFilters()
  const filterDefs =
    searchQuery.objectType && SEARCH_OBJECT_TYPES[searchQuery.objectType]
      ? ALL_FILTERS[SEARCH_OBJECT_TYPES[searchQuery.objectType]].filters
      : findCommonFiltersForAllObjectTypes(
        Object.keys(SEARCH_OBJECT_TYPES),
        ALL_FILTERS
      )
  const filters = searchQuery.filters
  return (
    <span className="asLink">
      <b>
        {searchQuery.objectType
          ? SEARCH_OBJECT_LABELS[searchQuery.objectType]
          : "Everything"}
      </b>
      {filters.length > 0 ? (
        <>
          {" "}
          filtered on{" "}
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
    </span>
  )
}

SearchDescription.propTypes = {
  searchQuery: SearchQueryPropType,
  showPlaceholders: PropTypes.bool
}

export const findCommonFiltersForAllObjectTypes = (
  searchObjectTypes,
  theSearchFilters
) =>
  searchObjectTypes
    .map(type => theSearchFilters[type].filters)
    .reduce((filters1, filters2) =>
      _pickBy(filters1, (value, key) => filters2[key])
    )

export const deserializeQueryParams = (
  objType,
  queryParams,
  callbackFunction
) => {
  // From query params to search filters
  const text = queryParams.text || ""
  const usedFilters = []
  const promises = []
  if (objType) {
    const EXTRA_FILTERS = extraFilters()
    const extraFilterDefs = EXTRA_FILTERS[objType] || []
    extraFilterDefs.map(filterKey => {
      if (Object.prototype.hasOwnProperty.call(queryParams, filterKey)) {
        usedFilters.push({ key: filterKey, value: queryParams[filterKey] })
      }
      return null
    })
    const ALL_FILTERS = searchFilters()
    const filterDefs = ALL_FILTERS[objType].filters
    Object.entries(filterDefs).map(([filterKey, filterDef]) => {
      const deser = filterDef.deserializer(
        filterDef.props,
        queryParams,
        filterKey
      )
      if (deser && deser.then instanceof Function) {
        // deserialize returns a Promise
        promises.push(deser)
      } else if (deser) {
        // deserialize returns filter data
        usedFilters.push(deser)
      }
      return null
    })
  }
  Promise.all(promises).then(dataList => {
    dataList.forEach((filterData, index) => {
      // update filters
      usedFilters.push(filterData)
    })
    callbackFunction(objType, usedFilters, text)
  })
}
