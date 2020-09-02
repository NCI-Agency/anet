import { format } from "date-fns"

export function yearTitleFormat(date) {
  return format(date, "yyyy")
}

export function monthTitleFormat(date) {
  return format(date, "MMMM yyyy")
}
