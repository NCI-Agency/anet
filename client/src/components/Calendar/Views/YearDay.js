import styled from "@emotion/styled"
import { countToHeatBgc } from "components/Calendar/utils/helpers"
import { format } from "date-fns"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"

const YearDay = ({
  dailyEvents,
  eventClick,
  dayClick,
  date,
  sameYear,
  colorScale,
  textColor
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipLeft, setTooltipLeft] = useState(true)
  const dayNode = useRef(null)

  useEffect(function alignTooltip() {
    if (dayNode.current) {
      const xPos = dayNode.current.getBoundingClientRect().x
      if (xPos !== 0) {
        if (xPos < window.innerWidth / 2) {
          setTooltipLeft(false)
        } else {
          setTooltipLeft(true)
        }
      }
    }
  }, [])

  const sameYearAttr = sameYear ? null : "notSame"
  return (
    <YearDayBox
      onMouseEnter={() => {
        setShowTooltip(sameYear)
      }}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => dayClick({ date, dailyEvents })}
      date={format(date, "dd/MM/yyyy")}
      bgc={countToHeatBgc(dailyEvents.length, colorScale)}
      data-same-year={sameYearAttr}
      ref={dayNode}
    >
      <DayHoverInfo
        className="dayHoverInfo"
        tooltipLeft={tooltipLeft}
        shouldDisplay={showTooltip}
      >
        <div>{format(date, "dd/MM/yyyy")}</div>
        {dailyEvents.map(e => (
          <DayEventTitle
            textColor={textColor}
            key={e.title}
            onClick={clickEvent => {
              eventClick(e)
              clickEvent.stopPropagation()
            }}
          >
            {e.title}
          </DayEventTitle>
        ))}
      </DayHoverInfo>
    </YearDayBox>
  )
}

YearDay.propTypes = {
  dailyEvents: PropTypes.arrayOf(PropTypes.object),
  eventClick: PropTypes.func,
  dayClick: PropTypes.func,
  date: PropTypes.object,
  sameYear: PropTypes.bool,
  colorScale: PropTypes.object,
  textColor: PropTypes.string
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
  &[data-same-year="notSame"] {
    border: none;
    background-color: transparent;
  }
`

const DayHoverInfo = styled.div`
  position: absolute;
  display: ${props => (props.shouldDisplay ? "block" : "none")};
  border: 2px solid blue;
  background-color: yellowgreen;
  color: white;
  top: 0;
  left: ${props => (props.tooltipLeft ? "0" : "auto")};
  right: ${props => (props.tooltipLeft ? "auto" : "0")};
  transform: ${props =>
    props.tooltipLeft ? "translate(-90%, -90%)" : "translate(90%, -90%)"};
  border-radius: 8px;
  padding: 5px 5px;
  min-width: 140px;
  min-height: 50px;
  z-index: 20;
`

const DayEventTitle = styled.div`
  color: ${props => props.textColor};
  cursor: pointer;
  border-top: 1px dashed black;
`

export default YearDay
