import moment from "moment"

export const BETWEEN = "0"
export const BEFORE = "1"
export const AFTER = "2"
export const LAST_DAY = -1 * 1000 * 60 * 60 * 24
export const LAST_WEEK = LAST_DAY * 7
export const LAST_MONTH = LAST_DAY * 30

export const RANGE_TYPE_LABELS = {
  [BETWEEN]: "Between",
  [BEFORE]: "Before",
  [AFTER]: "After",
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
  let startKey = dateRangeStartKey(queryKey)
  let endKey = dateRangeEndKey(queryKey)

  if (value.relative === BETWEEN) {
    // Between start and end date
    return {
      [startKey]: moment(value.start).startOf("day"),
      [endKey]: moment(value.end).endOf("day")
    }
  } else if (value.relative === BEFORE) {
    // Before end date
    return {
      [endKey]: moment(value.end).endOf("day")
    }
  } else if (value.relative === AFTER) {
    // After start date
    return {
      [startKey]: moment(value.start).startOf("day")
    }
  } else {
    // LAST_DAY, LAST_WEEK, LAST_MONTH => Time relative to now, up till now
    return {
      [startKey]: parseInt(value.relative),
      [endKey]: moment().endOf("day")
    }
  }
}
