import moment from "moment"

const monthLayout = ({ item, dimensions }) => {
  // figure out which month
  const momentDate = moment(item.date)

  // This is the [0,0] day of the month
  const firstDayofFirstWeekOfTheMonth = momentDate
    .startOf("month")
    .startOf("isoWeek")

  const endOfMonth = momentDate.endOf("month")

  const numOfWeeks = endOfMonth.diff(firstDayofFirstWeekOfTheMonth, "weeks") + 1
  const daysDiff = momentDate.diff(firstDayofFirstWeekOfTheMonth, "days")

  const weekDiff = Math.floor(daysDiff / 7)
  const weekDayDiff = daysDiff % 7

  return {
    xPos: (dimensions.width * weekDayDiff) / 7,
    yPos: (dimensions.height * weekDiff) / numOfWeeks,
    width: dimensions.width / 7,
    height: dimensions.height / numOfWeeks
  }
}

export default monthLayout
