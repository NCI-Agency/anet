import styled from "@emotion/styled"
import { changeSelectedDay } from "components/Calendar/actions"
import { getDayNames, renderDayNames } from "components/Calendar/utils/helpers"
import MonthDay from "components/Calendar/Views/MonthDay"
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
  eventClick,
  viewMonth,
  selectedDay,
  dispatcher,
  weekStartsOn
}) => {
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
      const dailyEvents = events.filter(event =>
        isSameDay(event.startDate, preventClosureDate)
      )
      week.push(
        <MonthDay
          key={dayName}
          dayName={dayName}
          onClick={() => dispatcher(changeSelectedDay(preventClosureDate))}
          selected={selected}
          dailyEvents={dailyEvents}
          eventClick={eventClick}
          sameMonth={sameMonth}
        />
      )
      curDay = addDays(curDay, 1)
    }
    return week
  }
}
MonthlyView.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  eventClick: PropTypes.func,
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
  margin-left: 1rem;
  margin-right: 1rem;
`

const MonthRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  text-align: center;
`

export default MonthlyView
