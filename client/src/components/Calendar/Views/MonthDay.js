import styled from "@emotion/styled"
import { format } from "date-fns"
import PropTypes from "prop-types"
import React from "react"
import { countToHeatBgc } from "../utils/helpers"
const MonthDay = ({
  date,
  dailyEvents,
  eventClick,
  dayClick,
  sameMonth,
  colorScale,
  textColor
}) => {
  return (
    <MonthDayBox
      onClick={() => dayClick({ date, dailyEvents })}
      bgc={countToHeatBgc(dailyEvents.length, colorScale)}
    >
      <DayNameBox sameMonth={sameMonth}>{format(date, "d")}</DayNameBox>
      <DayEventsBox>
        {dailyEvents.map(event => (
          <DayEventBox
            textColor={textColor}
            onClick={e => {
              eventClick(event)
              e.stopPropagation()
            }}
            key={event.title}
          >
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
  background-color: ${props => props.bgc};
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
  color: ${props => props.textColor};
  cursor: pointer;
  &:not(:first-of-type) {
    border-top: 1px dashed black;
    margin-top: 4px;
  }
  &:last-of-type {
    margin-bottom: 6px;
  }
`

MonthDay.propTypes = {
  date: PropTypes.object,
  dailyEvents: PropTypes.arrayOf(PropTypes.object),
  eventClick: PropTypes.func,
  dayClick: PropTypes.func,
  sameMonth: PropTypes.bool,
  colorScale: PropTypes.object,
  textColor: PropTypes.string
}

export default MonthDay
