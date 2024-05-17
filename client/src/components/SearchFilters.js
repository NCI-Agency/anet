import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
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
import {
  deserializeMulti as deserializeOrganizationMultiFilter,
  OrganizationMultiFilter
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
  CountryOverlayRow,
  LocationOverlayRow,
  PersonDetailedOverlayRow,
  PositionOverlayRow,
  TaskOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AppContext from "components/AppContext"
import { getBreadcrumbTrailAsText } from "components/BreadcrumbTrail"
import DictionaryField from "components/DictionaryField"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import _pickBy from "lodash/pickBy"
import { Location, Person, Position, Report, Task } from "models"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import LOCATIONS_ICON from "resources/locations.png"
import PEOPLE_ICON from "resources/people.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"
import { RECURSE_STRATEGY } from "searchUtils"
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
  labelClass: "pt-0",
  props: {
    queryKey: "subscribed",
    msg: "By me"
  }
}

const EmailFilter = {
  component: SelectFilter,
  deserializer: deserializeSelectFilter,
  props: {
    queryKey: "emailNetwork",
    options: Settings.emailNetworks,
    labels: Settings.emailNetworks
  }
}

const advancedSelectFilterCountryProps = {
  overlayColumns: [
    Settings.fields.location.name?.label,
    Settings.fields.location.digram?.label,
    Settings.fields.location.trigram?.label
  ],
  overlayRenderRow: CountryOverlayRow,
  objectType: Location,
  valueKey: "name",
  fields: Location.autocompleteQuery,
  addon: <Icon icon={IconNames.FLAG} />
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

export const searchFilters = function(includeAdminFilters) {
  const filters = {}

  const taskShortLabel = Settings.fields.task.shortLabel
  const authorWidgetFilters = {
    all: {
      label: "All",
      queryVars: { pendingVerification: false }
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
      queryVars: {}
    }
  }
  const attendeePositionWidgetFilters = {
    all: {
      label: "All",
      queryVars: {}
    }
  }
  const countryWidgetFilters = {
    activeCountries: {
      label: "Active countries",
      queryVars: {
        type: Location.LOCATION_TYPES.COUNTRY,
        status: Model.STATUS.ACTIVE
      }
    },
    allCountries: {
      label: "All countries",
      queryVars: { type: Location.LOCATION_TYPES.COUNTRY }
    }
  }
  const reportLocationWidgetFilters = Location.getReportLocationFilters()
  const positionLocationWidgetFilters = Location.getPositionLocationFilters()
  const organizationLocationFilters = Location.getOrganizationLocationFilters()
  const classificationOptions = Object.keys(Settings.classification.choices)
  const classificationLabels = Object.values(Settings.classification.choices)
  // Allow explicit search for "no classification"
  classificationOptions.unshift("")
  classificationLabels.unshift("<none>")

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
        component: OrganizationMultiFilter,
        deserializer: deserializeOrganizationMultiFilter,
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
          filterDefs: reportLocationWidgetFilters,
          placeholder: "Filter reports by location...",
          queryKey: "locationUuid"
        })
      },
      State: {
        component: ReportStateFilter,
        deserializer: deserializeReportStateFilter,
        isDefault: true,
        props: {
          queryKey: "state"
        }
      }
    }
  }
  if (includeAdminFilters) {
    filters[SEARCH_OBJECT_TYPES.REPORTS].filters = {
      ...filters[SEARCH_OBJECT_TYPES.REPORTS].filters,
      "Include all Drafts?": {
        component: RadioButtonFilter,
        deserializer: deserializeRadioButtonFilter,
        labelClass: "pt-0",
        props: {
          queryKey: "includeAllDrafts",
          options: [true, false],
          labels: ["Yes", "No"]
        }
      }
    }
  }
  filters[SEARCH_OBJECT_TYPES.REPORTS].filters = {
    ...filters[SEARCH_OBJECT_TYPES.REPORTS].filters,
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
    Classifications: {
      component: SelectFilter,
      dictProps: Settings.classification,
      deserializer: deserializeSelectFilter,
      props: {
        queryKey: "classification",
        options: classificationOptions,
        labels: classificationLabels
      }
    },
    "Sensitive Info": {
      component: CheckboxFilter,
      deserializer: deserializeCheckboxFilter,
      labelClass: "pt-0",
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

  const ranks = (Settings.fields.person.ranks || []).map(f => f.value)

  filters[SEARCH_OBJECT_TYPES.PEOPLE] = {
    filters: {
      "Within Organization": {
        component: OrganizationMultiFilter,
        deserializer: deserializeOrganizationMultiFilter,
        props: {
          queryKey: "orgUuid",
          queryRecurseStrategyKey: "orgRecurseStrategy",
          fixedRecurseStrategy: RECURSE_STRATEGY.CHILDREN
        }
      },
      Location: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterLocationProps, {
          filterDefs: positionLocationWidgetFilters,
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
        component: AdvancedSelectFilter,
        dictProps: Settings.fields.person.country,
        deserializer: deserializeAdvancedSelectFilter,
        props: Object.assign({}, advancedSelectFilterCountryProps, {
          filterDefs: countryWidgetFilters,
          placeholder: "Filter by country...",
          queryKey: "countryUuid"
        })
      },
      "Has Biography?": {
        component: RadioButtonFilter,
        deserializer: deserializeSelectFilter,
        labelClass: "pt-0",
        props: {
          queryKey: "hasBiography",
          options: [true, false],
          labels: ["Yes", "No"]
        }
      },
      "Holding Position As": {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "positionType",
          options: [
            Position.TYPE.REGULAR,
            Position.TYPE.SUPERUSER,
            Position.TYPE.ADMINISTRATOR
          ],
          labels: [
            Settings.fields.regular.position.name,
            Settings.fields.superuser.position.name,
            Settings.fields.administrator.position.name
          ]
        }
      },
      "Pending Verification": {
        component: RadioButtonFilter,
        deserializer: deserializeSelectFilter,
        labelClass: "pt-0",
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
      "Within Organization": {
        component: OrganizationMultiFilter,
        deserializer: deserializeOrganizationMultiFilter,
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
          filterDefs: organizationLocationFilters,
          placeholder: "Filter by location...",
          queryKey: "locationUuid"
        })
      },
      [`Has ${Settings.fields.organization.profile?.label}?`]: {
        component: RadioButtonFilter,
        deserializer: deserializeSelectFilter,
        labelClass: "pt-0",
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
      Type: {
        component: SelectFilter,
        dictProps: Settings.fields.position.type,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "type",
          options: [
            Position.TYPE.REGULAR,
            Position.TYPE.SUPERUSER,
            Position.TYPE.ADMINISTRATOR
          ],
          labels: [
            Settings.fields.regular.position.name,
            Settings.fields.superuser.position.name,
            Settings.fields.administrator.position.name
          ]
        }
      },
      "Within Organization": {
        component: OrganizationMultiFilter,
        deserializer: deserializeOrganizationMultiFilter,
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
          filterDefs: positionLocationWidgetFilters,
          placeholder: "Filter by location...",
          queryKey: "locationUuid"
        })
      },
      "Is Filled?": {
        component: RadioButtonFilter,
        deserializer: deserializeRadioButtonFilter,
        labelClass: "pt-0",
        props: {
          queryKey: "isFilled",
          options: [true, false],
          labels: ["Yes", "No"]
        }
      },
      "Has Pending Assessments": {
        component: CheckboxFilter,
        deserializer: deserializeCheckboxFilter,
        labelClass: "pt-0",
        props: {
          queryKey: "hasPendingAssessments",
          msg: "Yes"
        }
      }
    }
  }

  const locationTypeOptions = [
    Location.LOCATION_TYPES.POINT_LOCATION,
    Location.LOCATION_TYPES.GEOGRAPHICAL_AREA,
    Location.LOCATION_TYPES.COUNTRY,
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
      "Is Assigned?": {
        component: RadioButtonFilter,
        deserializer: deserializeRadioButtonFilter,
        labelClass: "pt-0",
        props: {
          queryKey: "isAssigned",
          options: [true, false],
          labels: ["Yes", "No"]
        }
      },
      "Within Organization": {
        component: OrganizationMultiFilter,
        deserializer: deserializeOrganizationMultiFilter,
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

  filters[SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS] = { filters: {} }

  const mimeTypes = Settings.fields.attachment.mimeTypes
  filters[SEARCH_OBJECT_TYPES.ATTACHMENTS] = {
    filters: {
      "Mime Type": {
        component: SelectFilter,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "mimeType",
          options: mimeTypes,
          labels: mimeTypes
        }
      },
      Classifications: {
        component: SelectFilter,
        dictProps: Settings.classification,
        deserializer: deserializeSelectFilter,
        props: {
          queryKey: "classification",
          options: classificationOptions,
          labels: classificationLabels
        }
      },
      Owner: {
        component: AdvancedSelectFilter,
        deserializer: deserializeAdvancedSelectFilter,
        props: {
          ...advancedSelectFilterPersonProps,
          filterDefs: authorWidgetFilters,
          placeholder: "Filter attachments by owner...",
          queryKey: "authorUuid"
        }
      }
    }
  }

  for (const filtersForType of Object.values(filters)) {
    filtersForType.filters.Status = StatusFilter
    filtersForType.filters.Subscribed = SubscriptionFilter
    filtersForType.filters["With Email"] = EmailFilter
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
  const ChildComponent = dictProps ? DictionaryField : element.component
  const additionalProps = dictProps
    ? { wrappedComponent: element.component, dictProps }
    : {}
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
  const { currentUser } = useContext(AppContext)
  const ALL_FILTERS = searchFilters(currentUser?.isAdmin())
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
    const ALL_FILTERS = searchFilters(true)
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
