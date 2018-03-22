import 'bootstrap/dist/css/bootstrap.css'
import './index.css'

import 'core-js/shim'
import 'locale-compare-polyfill'
import './utils'

import React from 'react'
import ReactDOM from 'react-dom'
import {Route} from 'react-router'
import {BrowserRouter} from 'react-router-dom'
//import {InjectablesProvider} from 'react-injectables'  FIXME: React16

import App from 'pages/App'

import API from 'api'

window.onerror = function(message, url, lineNumber, columnNumber) {
	API.logOnServer('ERROR', url, lineNumber+":"+columnNumber, message)
	return false
  }

ReactDOM.render((
//	<InjectablesProvider> FIXME: React16
		<BrowserRouter onUpdate={jumpToTop}>
			<Route path="/" component={App} />
		</BrowserRouter>
//	</InjectablesProvider>  FIXME: React16
), document.getElementById('root'))

function jumpToTop() {
	window.scrollTo(0,0)
}
