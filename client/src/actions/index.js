export const DEFAULT_PAGE_PROPS = {useNavigation: true, fluidContainer: false, minimalHeader: false}
export const PAGE_PROPS_NO_NAV = {useNavigation: false, fluidContainer: false, minimalHeader: false}
export const PAGE_PROPS_MIN_HEAD = {useNavigation: false, fluidContainer: false, minimalHeader: true}
export const PAGE_PROPS_FLUID = {useNavigation: false, fluidContainer: true, minimalHeader: false}

export const setPageProps = pageProps => ({
	type: 'SET_PAGE_PROPS',
	pageProps
})
