import { createStore, compose } from 'redux'
import persistReducer from '../reducers/persistReducer'

/**
 * configureStore function which encapsulates the store creation logic,
 * middlewares and enhancers can be added here to the redux store
 * @param {Object} initialState
 */
export default function configureStore(initialState) {
	let finalCreateStore = compose(
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
	)(createStore)

	const store = finalCreateStore(persistReducer, initialState)

	if (module.hot) {
	// Enable Webpack hot module replacement for reducers
		module.hot.accept('../reducers', () => {
			const nextReducer = require('../reducers')
			store.replaceReducer(nextReducer)
		})
	}

	return store
}
