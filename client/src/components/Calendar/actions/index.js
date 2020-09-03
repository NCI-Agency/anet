export const ACTION_TYPES = {
  CHANGE_VIEW: 1,
  CHANGE_ACVITE_DATE: 2,
  CHANGE_SELECTED_DAY: 3,
  CHANGE_TITLE: 4
}

export function changeView(incView) {
  return {
    type: ACTION_TYPES.CHANGE_VIEW,
    payload: incView
  }
}
export function changeViewDate(incDate) {
  return {
    type: ACTION_TYPES.CHANGE_ACTIVE_DATE,
    payload: incDate
  }
}
export function changeSelectedDay(incDay) {
  return {
    type: ACTION_TYPES.CHANGE_SELECTED_DAY,
    payload: incDay
  }
}
export function changeTitle(incTitle) {
  return {
    type: ACTION_TYPES.CHANGE_TITLE,
    payload: incTitle
  }
}

export default ACTION_TYPES
