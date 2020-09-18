import { DATE_LAYOUT_FORMAT } from "layouts/utils"
import moment from "moment"

const monthLayout = (item, dimensions, viewDate) => {
  // figure out which month
  const momentDate = moment(item.date, DATE_LAYOUT_FORMAT)

  if (!viewDate.isSame(momentDate, "month")) {
    return null
  }
  /**   Monday-Tuesday ....
   *   [0,0]-[1,0]**********
   *   [0,1]***************
   *   .
   *   .
   **/
  // This is the [0,0] day of the month
  const firstDayofFirstWeekOfTheMonth = moment(momentDate)
    .startOf("month")
    .startOf("isoWeek")

  const endOfMonth = moment(momentDate).endOf("month")

  const numOfWeeks = endOfMonth.diff(firstDayofFirstWeekOfTheMonth, "weeks") + 1
  const daysDiff = momentDate.diff(firstDayofFirstWeekOfTheMonth, "days")

  const weekDiff = Math.floor(daysDiff / 7)
  const weekDayDiff = daysDiff % 7

  return {
    x: (dimensions.width * weekDayDiff) / 7,
    y: (dimensions.height * weekDiff) / numOfWeeks,
    width: dimensions.width / 7,
    height: dimensions.height / numOfWeeks
  }
}

export default monthLayout
