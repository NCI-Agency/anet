export const DEFAULT_PAGE_PROPS = {
	useNavigation: true,
	minimalHeader: false,
}
export const PAGE_PROPS_NO_NAV = {
	useNavigation: false,
	minimalHeader: false,
}
export const PAGE_PROPS_MIN_HEAD = {
	useNavigation: false,
	minimalHeader: true,
}

export const SEARCH_OBJECT_TYPES = {
	REPORTS: 'Reports',
	PEOPLE: 'People',
	ORGANIZATIONS: 'Organizations',
	POSITIONS: 'Positions',
	LOCATIONS: 'Locations',
	TASKS: 'Tasks'
}

export const DEFAULT_SEARCH_PROPS = {
	onSearchGoToSearchPage: true,
	clearSearchQuery: true,
	searchObjectTypes: [
		SEARCH_OBJECT_TYPES.REPORTS,
		SEARCH_OBJECT_TYPES.PEOPLE,
		SEARCH_OBJECT_TYPES.ORGANIZATIONS,
		SEARCH_OBJECT_TYPES.POSITIONS,
		SEARCH_OBJECT_TYPES.LOCATIONS,
		SEARCH_OBJECT_TYPES.TASKS
	]
}
export const DEFAULT_SEARCH_QUERY = {objectType: '', text: '', filters: []}

/*
 *  action constructors
 */

export const setPageProps = pageProps => ({
	type: 'SET_PAGE_PROPS',
	pageProps
})

export const setSearchProps = searchProps => ({
	type: 'SET_SEARCH_PROPS',
	searchProps
})

export const setSearchQuery = searchQuery => ({
	type: 'SET_SEARCH_QUERY',
	searchQuery
})

export const clearSearchQuery = () => ({
	type: 'CLEAR_SEARCH_QUERY',
})
