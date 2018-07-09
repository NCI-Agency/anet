import { combineReducers } from 'redux'
import { loadingBarReducer } from 'react-redux-loading-bar'
import pageProps from './pageProps'
import searchProps from './searchProps'
import searchQuery from './searchQuery'

export default combineReducers({
	loadingBar: loadingBarReducer,
	pageProps,
	searchProps,
	searchQuery
})
