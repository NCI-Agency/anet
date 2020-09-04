export const ACTION_TYPES = {
  CHANGE_VIEW: 1,
  CHANGE_ACVITE_DATE: 2,
  CHANGE_TITLE: 3
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
export function changeTitle(incTitle) {
  return {
    type: ACTION_TYPES.CHANGE_TITLE,
    payload: incTitle
  }
}

export default ACTION_TYPES
