import { DEFAULT_SEARCH_QUERY } from '../actions'

const searchQuery = (state = DEFAULT_SEARCH_QUERY, action) => {
	switch (action.type) {
		case 'SET_SEARCH_QUERY':
			return Object.assign({}, state, action.searchQuery)
		default:
			return state
	}
}

export default searchQuery
