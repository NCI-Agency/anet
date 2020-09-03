import styled from "@emotion/styled"
import { COLOR_NAMES_TO_RGB } from "components/Calendar/utils/constants"
import { addDays, addMonths, format, startOfWeek, startOfYear } from "date-fns"
import React from "react"

export function getDayNames(someDate, weekStartsOn) {
  const dayNames = []
  const weekStart = startOfWeek(someDate, { weekStartsOn })
  for (let i = 0; i < 7; i++) {
    dayNames.push(format(addDays(weekStart, i), "E"))
  }
  return dayNames
}

export function renderDayNames(names) {
  return names.map(name => <DayNameBox key={name}>{name}</DayNameBox>)
}

const DayNameBox = styled.div`
  width: 100%;
`
export function getMonthNames(someDate, formatStr) {
  const monthNames = []
  const firstMonth = startOfYear(someDate)
  for (let i = 0; i < 12; i++) {
    monthNames.push(format(addMonths(firstMonth, i), formatStr))
  }
  return monthNames
}

export function renderMonthNames(names) {
  return names.map(name => <MonthNameBox key={name}>{name}</MonthNameBox>)
}

const MonthNameBox = styled.div`
  width: 100%;
  text-align: center;
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
