import {
  monthNextAction,
  monthPrevAction
} from "Calendar/actions/buttonActions"
import VIEWS from "Calendar/utils/constants"
import { monthTitleFormat } from "Calendar/utils/formats"
export function defaultNextAction(dispatch, state) {
  monthNextAction(dispatch, state)
}
export function defaultPrevAction(dispatch, state) {
  monthPrevAction(dispatch, state)
}

export const defaultView = VIEWS.MONTHLY

export const defaultTitleFormatter = monthTitleFormat

export const defaultTitle = defaultTitleFormatter(new Date())
