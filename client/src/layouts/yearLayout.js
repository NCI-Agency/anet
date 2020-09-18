import { DATE_LAYOUT_FORMAT } from "layouts/utils"
import moment from "moment"
const yearLayout = (item, dimensions, dateField, viewDate) => {
  // figure out which year input is
  // figure out where the item located according to its day
  // calculate the how much x-y translation
  const momentDate = moment(item[dateField], DATE_LAYOUT_FORMAT)
  if (!viewDate.isSame(momentDate, "year")) {
    return null
  }
  // this day is basically [0,0] coordinates of the chart
  const firstDayOfFirstWeekofTheYear = moment(momentDate)
    .startOf("year")
    .startOf("isoWeek")

  const endOfYear = moment(momentDate).endOf("year")

  const numOfWeeks = endOfYear.diff(firstDayOfFirstWeekofTheYear, "weeks") + 1
  const dayDiff = momentDate.diff(firstDayOfFirstWeekofTheYear, "days")

  const weekDiff = Math.floor(dayDiff / 7)

  const weekDayDiff = dayDiff % 7
  // console.log("yearLayout item=", item, {
  //   momentDate,
  //   dayDiff,
  //   weekDiff,
  //   weekDayDiff,
  //   numOfWeeks
  // })
  return {
    x: (dimensions.width * weekDiff) / numOfWeeks,
    y: (dimensions.height * weekDayDiff) / 7,
    width: dimensions.width / numOfWeeks,
    height: dimensions.height / 7
  }
}

export default yearLayout
