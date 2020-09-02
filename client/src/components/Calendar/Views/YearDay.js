import React, { useState } from "react"

import PropTypes from "prop-types"
import { countToHeatBgc } from "components/Calendar/utils/helpers"
import { format } from "date-fns"
import styled from "@emotion/styled"

const YearDay = ({ dailyEvents, date }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <YearDayBox
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}
      // FIXME: Add when clicked go to daily view maybe
      onClick={() => console.log("daily View")}
      date={format(date, "dd/MM/yyyy")}
      bgc={countToHeatBgc(dailyEvents.length, { low: 1, mid: 2, color: "red" })}
    >
      {hovered && (
        <div className="dayHoverInfo">
          <div>{format(date, "dd/MM/yyyy")}</div>
          {dailyEvents.map(e => (
            <div
              key={e.title}
              onClick={clickEvent => {
                console.log(e.url)
                clickEvent.stopPropagation()
              }}
            >
              {e.title}
            </div>
          ))}
        </div>
      )}
    </YearDayBox>
  )
}

YearDay.propTypes = {
  dailyEvents: PropTypes.arrayOf(PropTypes.object),
  date: PropTypes.object
}
const YearDayBox = styled.div`
  background-color: ${props => props.bgc};
  width: 100%;
  height: 100%;
  min-width: 5px;
  min-height: 18px;
  border: 1px solid black;
  border-radius: 2px;
  position: relative;
  .dayHoverInfo {
    position: absolute;
    outline: 2px solid blue;
    background-color: yellowgreen;
    color: white;
    top: 0;
    left: 0;
    transform: translate(-95%, -95%);
    border-radius: 4px;
  }
`

export default YearDay
