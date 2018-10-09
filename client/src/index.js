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
import rootReducer from './reducers'
import { jumpToTop } from 'components/Page'

import App from 'pages/App'

import API from 'api'

window.onerror = function(message, url, lineNumber, columnNumber) {
	API.logOnServer('ERROR', url, lineNumber+":"+columnNumber, message)
	return false
  }

const store = createStore(rootReducer)

ReactDOM.render((
	<Provider store={store}>
		<BrowserRouter onUpdate={jumpToTop}>
			<Route path="/" component={App} />
		</BrowserRouter>
	</Provider>
), document.getElementById('root'))
