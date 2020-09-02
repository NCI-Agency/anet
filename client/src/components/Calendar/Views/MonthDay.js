import PropTypes from "prop-types"
import React from "react"
import styled from "@emotion/styled"
import { countToHeatBgc } from "../utils/helpers"

const MonthDay = ({ dayName, dailyEvents, onClick, selected, sameMonth }) => {
  return (
    <MonthDayBox
      selected={selected}
      onClick={onClick}
      bgc={countToHeatBgc(dailyEvents.length, { low: 1, mid: 2, color: "red" })}
      sameMonth={sameMonth}
    >
      <div className="dayName">{dayName}</div>
      <div className="dayContent">
        {dailyEvents.map(event => (
          <div key={event.title}>{event.title}</div>
        ))}
      </div>
    </MonthDayBox>
  )
}

const MonthDayBox = styled.div`
  width: 100%;
  max-height: auto;
  min-height: 50px;
  background-color: ${props =>
    props.selected ? "rgb(204, 255, 204)" : props.bgc};
  display: flex;
  flex-direction: column;
  border: 1px solid black;
  margin: 2px 2px;
  border-radius: 4px;
  .dayName {
    text-align: right;
    color: ${props => (props.sameMonth ? "black" : "rgb(0, 0, 0, 0.6)")};
    font-weight: ${props => (props.sameMonth ? "bold" : "normal")};
  }
  .dayContent {
    height: 100%;
  }
`

MonthDay.propTypes = {
  dayName: PropTypes.string,
  dailyEvents: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  sameMonth: PropTypes.bool
}

export default MonthDay
