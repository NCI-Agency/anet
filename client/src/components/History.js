/* eslint no-restricted-globals: ["off", "history"] */ //TODO remove this
import {browserHistory} from 'react-router'
import {createLocation} from 'history/lib/LocationUtils'
import {createPath} from 'history/lib/PathUtils'

export default browserHistory

let originalReplace = browserHistory.replace
browserHistory.replace = function(path, state, triggerHandlers) {
	if (typeof state === 'boolean') {
		triggerHandlers = state
		state = null
	}

	if (triggerHandlers === false) {
		const location = createLocation(path, state, null, history.location)
		history.replaceState(state, null, createPath(location))
	} else {
		originalReplace(path, state)
	}
}

let originalPush = browserHistory.push
browserHistory.push = function(path, state) {
	if (typeof path !== 'object') {
		path = {pathname: path}
	}

	if (state) {
		path.state = state
	}

	originalPush(path)
}
