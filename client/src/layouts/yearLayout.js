import { DATE_LAYOUT_FORMAT } from "layouts/utils"
import moment from "moment"

const yearLayout = (item, dimensions, viewDate) => {
  // figure out which year input is
  const momentDate = moment(item.date, DATE_LAYOUT_FORMAT)
  if (!viewDate.isSame(momentDate, "year")) {
    return null
  }
  // figure out where the item located according to its day
  // calculate how much x-y translation needed
  /**           Jan           Feb ....
   *   Monday  [0,0][1,0]**********
   *   Tuesday [0,1]***************
   *   .
   *   .
   **/
  // First day of first week of the year is basically [0,0] coordinates of the chart
  const firstDayOfFirstWeekofTheYear = moment(momentDate)
    .startOf("year")
    .startOf("isoWeek")

  const endOfYear = moment(momentDate).endOf("year")

  const numOfWeeks = endOfYear.diff(firstDayOfFirstWeekofTheYear, "weeks") + 1
  const dayDiff = momentDate.diff(firstDayOfFirstWeekofTheYear, "days")

  const weekDiff = Math.floor(dayDiff / 7)

  const weekDayDiff = dayDiff % 7

  return {
    x: (dimensions.width * weekDiff) / numOfWeeks,
    y: (dimensions.height * weekDayDiff) / 7,
    width: dimensions.width / numOfWeeks,
    height: dimensions.height / 7
  }
}

export default yearLayout
