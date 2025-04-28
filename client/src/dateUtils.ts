import { L } from "@fullcalendar/list/internal-common"
import moment from "moment"

export const BETWEEN = "0"
export const BEFORE = "1"
export const AFTER = "2"
export const ON = "3"
export const LAST_X_DAYS = "4"
export const LAST_DAY = -1 * 1000 * 60 * 60 * 24
export const LAST_WEEK = LAST_DAY * 7
export const LAST_MONTH = LAST_DAY * 30

export const RANGE_TYPE_LABELS = {
  [BETWEEN]: "Between",
  [BEFORE]: "Before",
  [AFTER]: "After",
  [ON]: "On",
  [LAST_X_DAYS]: "Last … days",
  [LAST_DAY]: "Last 24 hours",
  [LAST_WEEK]: "Last 7 days",
  [LAST_MONTH]: "Last 30 days"
}

export function dateRangeStartKey(queryKey) {
  return queryKey ? queryKey + "Start" : "start"
}

export function dateRangeEndKey(queryKey) {
  return queryKey ? queryKey + "End" : "end"
}

export function dateToQuery(queryKey, value) {
  const startKey = dateRangeStartKey(queryKey)
  const endKey = dateRangeEndKey(queryKey)
  const startDateStart = value.start && moment(value.start).startOf("day")
  const startDateEnd = value.start && moment(value.start).endOf("day")
  const endDateEnd = value.end && moment(value.end).endOf("day")

  if (value.relative === BETWEEN) {
    // Between start and end date
    return {
      [startKey]: startDateStart,
      [endKey]: endDateEnd
    }
  } else if (value.relative === BEFORE) {
    // Before end date
    return {
      [endKey]: endDateEnd
    }
  } else if (value.relative === AFTER) {
    // After start date
    return {
      [startKey]: startDateStart
    }
  } else if (value.relative === ON) {
    // On given date
    return {
      [startKey]: startDateStart,
      [endKey]: startDateEnd
    }
  } else if (value.relative === LAST_X_DAYS) {
    const days = value.days
    if (days && !isNaN(days)) {
      const milliseconds = days * LAST_DAY
      return {
        [startKey]: milliseconds
      }
    } else {
      return {}
    }
  } else {
    // LAST_DAY, LAST_WEEK, LAST_MONTH => Time relative to now, up till now
    return {
      [startKey]: parseInt(value.relative)
    }
  }
}
