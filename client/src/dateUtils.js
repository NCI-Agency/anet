import React from 'react'
import moment from 'moment'

export const BETWEEN = "0"
export const BEFORE = "1"
export const AFTER = "2"
export const LAST_DAY = -1 * 1000 * 60 * 60 * 24
export const LAST_WEEK = LAST_DAY * 7
export const LAST_MONTH = LAST_DAY * 30

export const RANGE_TYPE_LABELS = {
	[BETWEEN]: 'Between',
	[BEFORE]: 'Before',
	[AFTER]: 'After',
	[LAST_DAY]: 'Last 24 hours',
	[LAST_WEEK]: 'Last 7 days',
	[LAST_MONTH]: 'Last 30 days',
}

export function dateToQuery(queryKey, value) {
	let startKey = queryKey ? queryKey + 'Start' : 'start'
	let endKey = queryKey ? queryKey + 'End' : 'end'

	if (value.relative === BETWEEN) {
		// Between start and end date
		return {
			[startKey]: moment(value.start).startOf('day').valueOf(),
			[endKey]: moment(value.end).endOf('day').valueOf(),
		}
	}
	else if (value.relative === BEFORE) {
		// Before end date
		return {
			[endKey]: moment(value.end).endOf('day').valueOf(),
		}
	}
	else if (value.relative === AFTER) {
		// After start date
		return {
			[startKey]: moment(value.start).startOf('day').valueOf(),
		}
	}
	else {
		// Time relative to now
		return {
			[startKey]: value.relative
		}
	}
}	
