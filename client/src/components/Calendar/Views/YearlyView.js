import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React from "react"

const YearlyView = ({
  events,
  activeYear,
  selectedDay,
  dispatcher,
  onlyWeekdays
}) => {
  // const remainingEvents = [...events]
  return (
    <YearlyViewBox>{renderDayNames(getDayNames(onlyWeekdays))}</YearlyViewBox>
  )

  function renderDayNames(dayNames) {
    return (
      <YearSideBar>
        {dayNames.map(dayName => (
          <DayNameBox key={dayName}>{dayName}</DayNameBox>
        ))}
      </YearSideBar>
    )
  }

  function getDayNames(onlyWeekdays) {
    if (onlyWeekdays) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri"]
    }
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  }
}
YearlyView.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  activeYear: PropTypes.object,
  selectedDay: PropTypes.object,
  dispatcher: PropTypes.func,
  onlyWeekdays: PropTypes.bool
}

const YearlyViewBox = styled.div`
  outline: 2px solid pink;
`

const YearSideBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
`

const DayNameBox = styled.div`
  width: 100%;
`

export default YearlyView
