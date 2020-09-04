import VIEWS from "components/Calendar/utils/constants"
import { format } from "date-fns"

export function yearTitleFormat(date) {
  return format(date, "yyyy")
}

export function monthTitleFormat(date) {
  return format(date, "MMMM yyyy")
}

export const TITLE_FORMATS = {
  [VIEWS.YEARLY]: yearTitleFormat,
  [VIEWS.MONTHLY]: monthTitleFormat
}
