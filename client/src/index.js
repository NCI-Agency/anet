import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

import 'core-js/shim'
import 'locale-compare-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/lib/integration/react'
import { persistStore } from 'redux-persist'

import App from 'pages/App'
import { jumpToTop } from 'components/Page'

import configureStore from './store/configureStore'
import API from 'api'

const store = configureStore()
const persistor = persistStore(store)

window.onerror = function(message, url, lineNumber, columnNumber) {
	API.logOnServer('ERROR', url, lineNumber+":"+columnNumber, message)
	return false
}

ReactDOM.render((
	<Provider store={store}>
		<PersistGate persistor={persistor}>
			<BrowserRouter onUpdate={jumpToTop}>
				<Route path="/" component={App} />
			</BrowserRouter>
		</PersistGate>
	</Provider>
), document.getElementById('root'))
