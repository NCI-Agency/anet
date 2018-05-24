export const DEFAULT_PAGE_PROPS = {useNavigation: true, minimalHeader: false, onSearchGoToSearchPage: true}
export const PAGE_PROPS_NO_NAV = {useNavigation: false, minimalHeader: false, onSearchGoToSearchPage: true}
export const PAGE_PROPS_MIN_HEAD = {useNavigation: false, minimalHeader: true, onSearchGoToSearchPage: true}
export const DEFAULT_SEARCH_QUERY = {text: ''}

/*
 *  action constructors
 */

export const setPageProps = pageProps => ({
	type: 'SET_PAGE_PROPS',
	pageProps
})

export const setSearchQuery = searchQuery => ({
	type: 'SET_SEARCH_QUERY',
	searchQuery
})
