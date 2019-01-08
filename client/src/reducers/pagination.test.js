import reducer from './pagination'
import * as types from '../constants/ActionTypes'
import { REPORT_DRAFT } from '../constants'

describe('pagination reducer', () => {
	it('should return the initial state', () => {
		expect(reducer(undefined, {})).toEqual(
			{
				pageTypes: {}
			}
		)
	})

	it('should handle SET_PAGINATION', () => {
		expect(
			reducer(undefined, {
				type: types.SET_PAGINATION,
				payload: {
					pageKey: REPORT_DRAFT,
					pageNum: 1,
				}
			})
		).toEqual(
			{
				pageTypes: { REPORT_DRAFT: { pageNum: 1 } },
			}
		)

		expect(
			reducer(
				{
					pageTypes: { REPORT_DRAFT: { pageNum: 1 } },
				},
				{
					type: types.SET_PAGINATION,
					payload: {
						pageKey: 'REPORT_FUTURE',
						pageNum: 2,
					}
				}
			)
		).toEqual(
			{
				pageTypes: {
					REPORT_DRAFT: { pageNum: 1 },
					REPORT_FUTURE: { pageNum: 2 }
				},
			},
		)
	})
})
