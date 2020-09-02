import styled from "@emotion/styled"
import { changeSelectedDay } from "Calendar/actions"
import MonthDay from "Calendar/Views/MonthDay"
import {
  addDays,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from "date-fns"
import PropTypes from "prop-types"
import React from "react"

const MonthlyView = ({
  events,
  activeMonth,
  selectedDay,
  dispatcher,
  onlyWeekdays
}) => {
  let remainingEvents = [...events]
  return (
    <MonthlyViewBox>
      {renderDayNames(getDayNames())}
      {renderMonthDays()}
    </MonthlyViewBox>
  )

  function renderDayNames(dayNames) {
    return (
      <MonthRow>
        {dayNames.map(dayName => (
          <DayNameBox key={dayName}>{dayName}</DayNameBox>
        ))}
      </MonthRow>
    )
  }

  function getDayNames(onlyWeekdays) {
    if (onlyWeekdays) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri"]
    }
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  }

  function renderMonthDays() {
    // get day 1 of the month (Ex: 1st of June)
    const firstDayOfMonth = startOfMonth(activeMonth)
    // get Sunday on the week of day 1 (Ex: 28th July)
    let dayCounter = startOfWeek(firstDayOfMonth)
    const monthDays = []
    do {
      monthDays.push(
        <MonthRow key={dayCounter}>{getWeekDays(dayCounter)}</MonthRow>
      )
      dayCounter = addDays(dayCounter, 7)
    } while (isSameMonth(dayCounter, firstDayOfMonth))
    return <>{monthDays}</>
  }

  function getWeekDays(theDate) {
    let numOfDays = 7
    if (onlyWeekdays) {
      numOfDays = 5
    }
    let curDay = getFirstDayOfTheWeek(theDate)
    const week = []
    for (let i = 0; i < numOfDays; i++) {
      const selected = isSameDay(curDay, selectedDay)
      const dayNum = format(curDay, "d")
      const preventClosureDate = curDay
      const tempEvents = []
      const dailyEvents = remainingEvents.filter(event => {
        if (isSameDay(event.startDate, preventClosureDate)) {
          return true
        }
        tempEvents.push(event)
        return false
      })
      week.push(
        <MonthDay
          key={dayNum}
          dayNum={dayNum}
          content={dayNum}
          onClick={() => dispatcher(changeSelectedDay(preventClosureDate))}
          selected={selected}
          dailyEvents={dailyEvents}
        />
      )
      remainingEvents = tempEvents
      curDay = addDays(curDay, 1)
    }
    return week
  }
  // theDate already sunday when called
  function getFirstDayOfTheWeek(theDate) {
    // get monday
    if (onlyWeekdays) {
      return addDays(theDate, 1)
    }
    return theDate
  }
}
MonthlyView.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  activeMonth: PropTypes.object,
  selectedDay: PropTypes.object,
  dispatcher: PropTypes.func,
  onlyWeekdays: PropTypes.bool
}

const MonthlyViewBox = styled.div`
  outline: 2px solid pink;
`

const MonthRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  text-align: center;
`

const DayNameBox = styled.div`
  width: 100%;
`

export default MonthlyView
