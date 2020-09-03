import {
  yearNextAction,
  yearPrevAction
} from "components/Calendar/actions/buttonActions"
import VIEWS from "components/Calendar/utils/constants"
import { yearTitleFormat } from "components/Calendar/utils/formats"

export function defaultNextAction(dispatch, state) {
  yearNextAction(dispatch, state)
}
export function defaultPrevAction(dispatch, state) {
  yearPrevAction(dispatch, state)
}

export const defaultView = VIEWS.YEARLY

export const defaultTitleFormatter = yearTitleFormat

export const defaultTitle = defaultTitleFormatter(new Date())
