import ACTION_TYPES from "components/Calendar/actions"
import {
  monthNextAction,
  monthPrevAction,
  yearNextAction,
  yearPrevAction
} from "components/Calendar/actions/buttonActions"
import VIEWS from "components/Calendar/utils/constants"
import {
  defaultNextAction,
  defaultPrevAction,
  defaultTitle,
  defaultTitleFormatter,
  defaultView
} from "components/Calendar/utils/defaults"
import {
  monthTitleFormat,
  yearTitleFormat
} from "components/Calendar/utils/formats"

export const initState = {
  activeDate: new Date(),
  selectedDay: new Date(),
  titleFormatter: defaultTitleFormatter,
  title: defaultTitle,
  view: defaultView,
  prevAction: defaultPrevAction,
  nextAction: defaultNextAction
}

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.CHANGE_VIEW_TO_YEARLY:
      return {
        ...state,
        view: VIEWS.YEARLY,
        prevAction: yearPrevAction,
        nextAction: yearNextAction,
        titleFormatter: yearTitleFormat,
        title: yearTitleFormat(state.activeDate)
      }
    case ACTION_TYPES.CHANGE_VIEW_TO_MONTHLY:
      return {
        ...state,
        view: VIEWS.MONTHLY,
        prevAction: monthPrevAction,
        nextAction: monthNextAction,
        titleFormatter: monthTitleFormat,
        title: monthTitleFormat(state.activeDate)
      }
    case ACTION_TYPES.CHANGE_ACTIVE_DATE:
      return {
        ...state,
        activeDate: action.payload,
        title: state.titleFormatter(action.payload)
      }
    case ACTION_TYPES.CHANGE_SELECTED_DAY:
      return { ...state, selectedDay: action.payload }
    case ACTION_TYPES.CHANGE_TITLE:
      return { ...state, title: action.payload }
    default:
      return state
  }
}

export default reducer
