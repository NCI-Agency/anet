import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React from "react"

const MonthDay = ({ dayNum, dailyEvents, onClick, selected }) => {
  let bgc
  if (dailyEvents.length === 0) {
    bgc = "transparent"
  } else if (dailyEvents.length < 2) {
    bgc = "hsl(0, 100%, 90%)"
  } else if (dailyEvents.length < 3) {
    bgc = "hsl(0, 100%, 80%)"
  } else {
    bgc = "hsl(0, 100%, 70%)"
  }

  return (
    <MonthDayBox selected={selected} onClick={onClick} bgc={bgc}>
      <div className="dayNum">{dayNum}</div>
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
  outline: 1px solid black;
  .dayNum {
    text-align: right;
  }
  .dayContent {
    height: 100%;
  }
`

MonthDay.propTypes = {
  dayNum: PropTypes.number,
  dailyEvents: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func,
  selected: PropTypes.bool
}

export default MonthDay
