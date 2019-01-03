import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

import 'core-js/shim'
import 'locale-compare-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import {Route} from 'react-router'
import {BrowserRouter} from 'react-router-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/lib/integration/react'
import { jumpToTop } from 'components/Page'
import { persistor, store } from './store'

import App from 'pages/App'

import API from 'api'

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
