import { changeActiveDate } from "Calendar/actions"
import { addMonths, addYears } from "date-fns"

export function monthNextAction(dispatch, state) {
  dispatch(changeActiveDate(addMonths(state.activeDate, 1)))
}

export function monthPrevAction(dispatch, state) {
  dispatch(changeActiveDate(addMonths(state.activeDate, -1)))
  return addMonths(state.activeDate, -1)
}
export function yearNextAction(dispatch, state) {
  dispatch(changeActiveDate(addYears(state.activeDate, 1)))
  return addYears(state.activeDate, 1)
}

export function yearPrevAction(dispatch, state) {
  dispatch(changeActiveDate(addYears(state.activeDate, -1)))
  return addYears(state.activeDate, -1)
}
