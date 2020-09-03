import styled from "@emotion/styled"
import { COLOR_NAMES_TO_RGB } from "components/Calendar/utils/constants"
import { addDays, format, startOfWeek } from "date-fns"
import React from "react"

export function getDayNames(someDate, weekStartsOn) {
  const dayNames = []
  const weekStart = startOfWeek(someDate, { weekStartsOn })
  for (let i = 0; i < 7; i++) {
    dayNames.push(format(addDays(weekStart, i), "E"))
  }
  return dayNames
}

export function renderDayNames(dayNames) {
  return dayNames.map(dayName => (
    <DayNameBox key={dayName}>{dayName}</DayNameBox>
  ))
}

const DayNameBox = styled.div`
  width: 100%;
`
/**
 * There are 4 levels, [none, low, mid, high], none always 0, high we don't need
 * @param {object} scale - example object: {low: 3, mid: 6, color: "red"}
 */
export function countToHeatBgc(count, scale) {
  if (count === 0) {
    return "transparent"
  } else if (count <= scale.low) {
    return `${COLOR_NAMES_TO_RGB[scale.color]}0.25)`
  } else if (count <= scale.mid) {
    return `${COLOR_NAMES_TO_RGB[scale.color]}0.6)`
  } else {
    return scale.color
  }
}
