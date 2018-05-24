import { combineReducers } from 'redux'
import { loadingBarReducer } from 'react-redux-loading-bar'
import pageProps from './pageProps'

export default combineReducers({
	loadingBar: loadingBarReducer,
	pageProps,
})
