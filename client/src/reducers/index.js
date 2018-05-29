import { combineReducers } from 'redux'
import { loadingBarReducer } from 'react-redux-loading-bar'
import pageProps from './pageProps'
import searchQuery from './searchQuery'

export default combineReducers({
	loadingBar: loadingBarReducer,
	pageProps,
	searchQuery
})
