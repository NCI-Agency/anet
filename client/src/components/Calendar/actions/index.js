const ACTION_TYPES = {
  CHANGE_VIEW_TO_YEARLY: 0,
  CHANGE_VIEW_TO_MONTHLY: 1,
  CHANGE_ACVITE_DATE: 2,
  CHANGE_SELECTED_DAY: 3,
  CHANGE_TITLE: 4
}

export function changeViewToYearly() {
  return {
    type: ACTION_TYPES.CHANGE_VIEW_TO_YEARLY
  }
}
export function changeViewToMonthly() {
  return {
    type: ACTION_TYPES.CHANGE_VIEW_TO_MONTHLY
  }
}
export function changeViewDate(payload) {
  return {
    type: ACTION_TYPES.CHANGE_ACTIVE_DATE,
    payload: payload
  }
}
export function changeSelectedDay(payload) {
  return {
    type: ACTION_TYPES.CHANGE_SELECTED_DAY,
    payload: payload
  }
}
export function changeTitle(payload) {
  return {
    type: ACTION_TYPES.CHANGE_TITLE,
    payload: payload
  }
}

export default ACTION_TYPES
