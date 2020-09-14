import moment from "moment"

const yearLayout = ({ item, dimensions }) => {
  // figure out which year input is
  // figure out where the item located according to its day
  // calculate the how much x-y translation
  const momentDate = moment(item.date)
  // this day is basically [0,0] coordinates of the chart
  const firstDayOfFirstWeekofTheYear = momentDate
    .startOf("year")
    .startOf("isoWeek")

  const endOfYear = momentDate.endOf("year")
  const numOfWeeks = endOfYear.diff(firstDayOfFirstWeekofTheYear, "weeks") + 1
  const diff = momentDate.diff(firstDayOfFirstWeekofTheYear, "days")

  const weekDiff = Math.floor(diff / 7)

  const weekDayDiff = diff % 7

  return {
    xPos: (dimensions.width * weekDiff) / numOfWeeks,
    yPos: (dimensions.height * weekDayDiff) / 7,
    width: dimensions.width / numOfWeeks,
    height: dimensions.height / 7
  }
}

export default yearLayout
