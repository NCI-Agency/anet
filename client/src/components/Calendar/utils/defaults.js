import {
  NEXT_ACTIONS,
  PREV_ACTIONS
} from "components/Calendar/actions/buttonActions"
import VIEWS from "components/Calendar/utils/constants"
import { TITLE_FORMATS } from "components/Calendar/utils/formats"

export const defaultView = VIEWS.MONTHLY

export const defaultNextAction = NEXT_ACTIONS[defaultView]
export const defaultPrevAction = PREV_ACTIONS[defaultView]

export const defaultTitleFormatter = TITLE_FORMATS[defaultView]

export const defaultTitle = defaultTitleFormatter(new Date())
