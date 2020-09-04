import VIEWS from "components/Calendar/utils/constants"
import { addMonths, addYears } from "date-fns"

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

export function monthNextAction(dispatch, state) {
  dispatch(changeViewDate(addMonths(state.viewDate, 1)))
}

export function monthPrevAction(dispatch, state) {
  dispatch(changeViewDate(addMonths(state.viewDate, -1)))
}
export function yearNextAction(dispatch, state) {
  dispatch(changeViewDate(addYears(state.viewDate, 1)))
}

export function yearPrevAction(dispatch, state) {
  dispatch(changeViewDate(addYears(state.viewDate, -1)))
}

export const PREV_ACTIONS = {
  [VIEWS.YEARLY]: yearPrevAction,
  [VIEWS.MONTHLY]: monthPrevAction
}
export const NEXT_ACTIONS = {
  [VIEWS.YEARLY]: yearNextAction,
  [VIEWS.MONTHLY]: monthNextAction
}
