import { SET_PAGINATION } from '../constants/ActionTypes'

const initialState = {
	pageTypes: {}
}

export default function pages(state = initialState, action) {
	switch (action.type) {
		case SET_PAGINATION:
			const { pageKey, pageNum } = action.payload
			return {
				...state,
				pageTypes: {
					[pageKey]: {
						pageNum
					},
					...state.pageTypes,
				}
			}
		default:
			return state
	}
}
