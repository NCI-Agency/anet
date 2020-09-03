import styled from "@emotion/styled"
import { getDayNames, renderDayNames } from "components/Calendar/utils/helpers"
import YearDay from "components/Calendar/Views/YearDay"
import {
  addDays,
  isSameDay,
  isSameYear,
  startOfWeek,
  startOfYear
} from "date-fns"
import PropTypes from "prop-types"
import React, { useMemo } from "react"
import { getMonthNames, renderMonthNames } from "../utils/helpers"

// FIXME: Add month names
const YearlyView = ({ events, eventClick, viewYear, weekStartsOn }) => {
  const getDays = useMemo(() => {
    // get 1st of January
    const firstDayOfTheYear = startOfYear(viewYear)
    // get first Monday on the week of 1st of Jan
    let dayCounter = startOfWeek(firstDayOfTheYear, {
      weekStartsOn
    })
    const yearDays = []
    do {
      yearDays.push(
        <YearColumn key={dayCounter}>
          {getWeekDays(dayCounter, firstDayOfTheYear)}
        </YearColumn>
      )
      dayCounter = addDays(dayCounter, 7)
    } while (isSameYear(dayCounter, viewYear))

    function getWeekDays(theDay, theYear) {
      const numOfDays = 7
      let curDay = theDay
      const week = []
      for (let i = 0; i < numOfDays; i++) {
        const sameYear = isSameYear(curDay, theYear)
        const preventClosureDate = curDay
        const dailyEvents = events.filter(event =>
          isSameDay(event.start, preventClosureDate)
        )
        week.push(
          <YearDay
            key={preventClosureDate}
            dailyEvents={dailyEvents}
            sameYear={sameYear}
            date={preventClosureDate}
            eventClick={eventClick}
          />
        )
        curDay = addDays(curDay, 1)
      }
      return week
    }
    return yearDays
  }, [viewYear, events, eventClick, weekStartsOn])

  return (
    <YearlyViewBox>
      <YearRow>
        <YearColumn>
          {renderDayNames(getDayNames(viewYear, weekStartsOn))}
        </YearColumn>
        {getDays}
      </YearRow>
      <YearRow>{renderMonthNames(getMonthNames(viewYear, "MMM"))}</YearRow>
    </YearlyViewBox>
  )
}
YearlyView.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  eventClick: PropTypes.func,
  viewYear: PropTypes.object,
  weekStartsOn: PropTypes.number
}
YearlyView.defaultProps = {
  weekStartsOn: 1
}
const YearlyViewBox = styled.div`
  outline: 2px solid pink;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-left: 1rem;
  margin-right: 1rem;
`

const YearColumn = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
`

const YearRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-beetween;
  align-items: center;
  width: 100%;
`

export default YearlyView
