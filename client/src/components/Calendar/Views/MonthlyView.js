import {
  addDays,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from "date-fns"
import { getDayNames, renderDayNames } from "components/Calendar/utils/helpers"

import MonthDay from "components/Calendar/Views/MonthDay"
import PropTypes from "prop-types"
import React from "react"
import { changeSelectedDay } from "components/Calendar/actions"
import styled from "@emotion/styled"

const MonthlyView = ({
  events,
  viewMonth,
  selectedDay,
  dispatcher,
  weekStartsOn
}) => {
  let remainingEvents = [...events]
  return (
    <MonthlyViewBox>
      <MonthRow>
        {renderDayNames(getDayNames(viewMonth, weekStartsOn))}
      </MonthRow>
      {renderMonthDays()}
    </MonthlyViewBox>
  )

  function renderMonthDays() {
    // get day 1 of the month (Ex: 1st of June)
    const firstDayOfMonth = startOfMonth(viewMonth)
    // get Sunday on the week of day 1 (Ex: 28th July)
    let dayCounter = startOfWeek(firstDayOfMonth, { weekStartsOn })
    const monthDays = []
    do {
      monthDays.push(
        <MonthRow key={dayCounter}>
          {getWeekDays(dayCounter, firstDayOfMonth)}
        </MonthRow>
      )
      dayCounter = addDays(dayCounter, 7)
    } while (isSameMonth(dayCounter, firstDayOfMonth))
    return monthDays
  }

  function getWeekDays(theDate, theMonth) {
    const numOfDays = 7
    let curDay = theDate
    const week = []
    for (let i = 0; i < numOfDays; i++) {
      const selected = isSameDay(curDay, selectedDay)
      const sameMonth = isSameMonth(curDay, theMonth)
      const dayName = format(curDay, "d")
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
          key={dayName}
          dayName={dayName}
          onClick={() => dispatcher(changeSelectedDay(preventClosureDate))}
          selected={selected}
          dailyEvents={dailyEvents}
          sameMonth={sameMonth}
        />
      )
      remainingEvents = tempEvents
      curDay = addDays(curDay, 1)
    }
    return week
  }
}
MonthlyView.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  viewMonth: PropTypes.object,
  selectedDay: PropTypes.object,
  dispatcher: PropTypes.func,
  weekStartsOn: PropTypes.number
}

MonthlyView.defaultProps = {
  weekStartsOn: 1
}

const MonthlyViewBox = styled.div`
  outline: 2px solid pink;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const MonthRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  text-align: center;
`

export default MonthlyView
