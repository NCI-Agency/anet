import { addMonths, addYears } from "date-fns"

import { changeViewDate } from "components/Calendar/actions"

export function monthNextAction(dispatch, state) {
  dispatch(changeViewDate(addMonths(state.viewDate, 1)))
}

export function monthPrevAction(dispatch, state) {
  dispatch(changeViewDate(addMonths(state.viewDate, -1)))
  return addMonths(state.viewDate, -1)
}
export function yearNextAction(dispatch, state) {
  dispatch(changeViewDate(addYears(state.viewDate, 1)))
  return addYears(state.viewDate, 1)
}

export function yearPrevAction(dispatch, state) {
  dispatch(changeViewDate(addYears(state.viewDate, -1)))
  return addYears(state.viewDate, -1)
}
