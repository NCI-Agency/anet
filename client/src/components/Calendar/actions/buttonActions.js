import { changeViewDate } from "components/Calendar/actions"
import VIEWS from "components/Calendar/utils/constants"
import { addMonths, addYears } from "date-fns"

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
