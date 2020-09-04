import {
  ACTION_TYPES,
  NEXT_ACTIONS,
  PREV_ACTIONS
} from "components/Calendar/actions"
import {
  defaultNextAction,
  defaultPrevAction,
  defaultTitle,
  defaultTitleFormatter,
  defaultView
} from "components/Calendar/utils/defaults"
import { TITLE_FORMATS } from "components/Calendar/utils/formats"

export const initState = {
  viewDate: new Date(),
  titleFormatter: defaultTitleFormatter,
  title: defaultTitle,
  view: defaultView,
  prevAction: defaultPrevAction,
  nextAction: defaultNextAction
}

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.CHANGE_VIEW:
      return {
        ...state,
        view: action.payload,
        prevAction: PREV_ACTIONS[action.payload],
        nextAction: NEXT_ACTIONS[action.payload],
        titleFormatter: TITLE_FORMATS[action.payload],
        title: TITLE_FORMATS[action.payload](state.viewDate)
      }
    case ACTION_TYPES.CHANGE_ACTIVE_DATE:
      return {
        ...state,
        viewDate: action.payload,
        title: state.titleFormatter(action.payload)
      }
    case ACTION_TYPES.CHANGE_TITLE:
      return { ...state, title: action.payload }
    default:
      return state
  }
}

export default reducer
