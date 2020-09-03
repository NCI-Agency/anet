import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React from "react"
import { countToHeatBgc } from "../utils/helpers"

const MonthDay = ({
  dayName,
  dailyEvents,
  eventClick,
  onClick,
  selected,
  sameMonth
}) => {
  return (
    <MonthDayBox
      selected={selected}
      onClick={onClick}
      bgc={countToHeatBgc(dailyEvents.length, { low: 1, mid: 2, color: "red" })}
    >
      <DayNameBox sameMonth={sameMonth}>{dayName}</DayNameBox>
      <DayEventsBox>
        {dailyEvents.map(event => (
          <DayEventBox onClick={() => eventClick(event)} key={event.title}>
            {event.title}
          </DayEventBox>
        ))}
      </DayEventsBox>
    </MonthDayBox>
  )
}

const MonthDayBox = styled.div`
  width: 100%;
  min-height: 50px;
  background-color: ${props =>
    props.selected ? "rgb(204, 255, 204)" : props.bgc};
  display: flex;
  flex-direction: column;
  border: 1px solid black;
  margin: 2px 2px;
  border-radius: 4px;
  .dayContent {
    height: 100%;
  }
`
// FIXME: alignment can be input
const DayNameBox = styled.div`
  text-align: right;
  color: ${props => (props.sameMonth ? "black" : "rgb(0, 0, 0, 0.6)")};
  font-weight: ${props => (props.sameMonth ? "bold" : "normal")};
`

const DayEventsBox = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
const DayEventBox = styled.div`
  color: blue;
  &:not(:first-of-type) {
    border-top: 1px dashed black;
    margin-top: 4px;
  }
  &:last-of-type {
    margin-bottom: 6px;
  }
`

MonthDay.propTypes = {
  dayName: PropTypes.string,
  dailyEvents: PropTypes.arrayOf(PropTypes.object),
  eventClick: PropTypes.func,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  sameMonth: PropTypes.bool
}

export default MonthDay
