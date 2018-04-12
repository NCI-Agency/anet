export const DEFAULT_PAGE_PROPS = {useNavigation: true, minimalHeader: false}
export const PAGE_PROPS_NO_NAV = {useNavigation: false, minimalHeader: false}
export const PAGE_PROPS_MIN_HEAD = {useNavigation: false, minimalHeader: true}

export const setPageProps = pageProps => ({
	type: 'SET_PAGE_PROPS',
	pageProps
})
