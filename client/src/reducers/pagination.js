import { SET_PAGINATION } from '../constants/ActionTypes'

const initialState = {}

export default function pages(state = initialState, action) {
	switch (action.type) {
		case SET_PAGINATION:
			const { pageKey, pageNum } = action.payload
			return {
				...state,
				[pageKey]: {
					pageNum
				},
			}
		default:
			return state
	}
}
