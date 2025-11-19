import Model from "components/Model"
import pluralize from "pluralize"
import Settings from "settings"
import * as types from "../constants/ActionTypes"

export const DEFAULT_PAGE_PROPS = {
  useNavigation: true,
  minimalHeader: false
}
export const PAGE_PROPS_NO_NAV = {
  useNavigation: false,
  minimalHeader: false
}
export const PAGE_PROPS_MIN_HEAD = {
  useNavigation: false,
  minimalHeader: true
}

// Map the object types enum as it comes from the server one-to-one to the types we use client-side
export const SEARCH_OBJECT_TYPES = {
  REPORTS: "REPORTS",
  PEOPLE: "PEOPLE",
  ORGANIZATIONS: "ORGANIZATIONS",
  POSITIONS: "POSITIONS",
  LOCATIONS: "LOCATIONS",
  TASKS: "TASKS",
  AUTHORIZATION_GROUPS: "AUTHORIZATION_GROUPS",
  ATTACHMENTS: "ATTACHMENTS",
  EVENTS: "EVENTS",
  EVENT_SERIES: "EVENT_SERIES"
}

export const SEARCH_OBJECT_LABELS = {
  [SEARCH_OBJECT_TYPES.REPORTS]: "Reports",
  [SEARCH_OBJECT_TYPES.PEOPLE]: "People",
  [SEARCH_OBJECT_TYPES.ORGANIZATIONS]: "Organizations",
  [SEARCH_OBJECT_TYPES.POSITIONS]: "Positions",
  [SEARCH_OBJECT_TYPES.LOCATIONS]: "Locations",
  [SEARCH_OBJECT_TYPES.TASKS]: pluralize(Settings.fields.task.shortLabel),
  [SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS]: "Communities",
  [SEARCH_OBJECT_TYPES.ATTACHMENTS]: "Attachments",
  [SEARCH_OBJECT_TYPES.EVENTS]: "Events",
  [SEARCH_OBJECT_TYPES.EVENT_SERIES]: "Event Series"
}

export const DEFAULT_SEARCH_PROPS = {
  onSearchGoToSearchPage: true,
  searchObjectTypes: [
    SEARCH_OBJECT_TYPES.REPORTS,
    SEARCH_OBJECT_TYPES.PEOPLE,
    SEARCH_OBJECT_TYPES.ORGANIZATIONS,
    SEARCH_OBJECT_TYPES.POSITIONS,
    SEARCH_OBJECT_TYPES.LOCATIONS,
    SEARCH_OBJECT_TYPES.TASKS,
    SEARCH_OBJECT_TYPES.AUTHORIZATION_GROUPS,
    SEARCH_OBJECT_TYPES.ATTACHMENTS,
    SEARCH_OBJECT_TYPES.EVENTS,
    SEARCH_OBJECT_TYPES.EVENT_SERIES
  ]
}
export const DEFAULT_SEARCH_QUERY = {
  objectType: "",
  text: "",
  filters: [
    {
      key: "Status",
      value: { value: Model.STATUS.ACTIVE, toQuery: { status: "ACTIVE" } }
    }
  ]
}

/*
 *  action constructors
 */

export const setPageProps = pageProps => ({
  type: "SET_PAGE_PROPS",
  pageProps
})

export const setSearchProps = searchProps => ({
  type: "SET_SEARCH_PROPS",
  searchProps
})

export const setSearchQuery = searchQuery => ({
  type: "SET_SEARCH_QUERY",
  searchQuery
})

export const clearSearchQuery = () => ({
  type: "CLEAR_SEARCH_QUERY"
})

export const setUserActivitiesState = userActivitiesState => ({
  type: types.SET_USER_ACTIVITIES_STATE,
  userActivitiesState
})

export const setPagination = (paginationKey, pageNum) => ({
  type: types.SET_PAGINATION,
  payload: {
    paginationKey,
    pageNum
  }
})

export const resetPagination = () => ({
  type: types.RESET_PAGINATION
})

export const resetPages = () => ({
  type: types.RESET_PAGES
})
