import reducer, { initState } from "components/Calendar/reducers/reducer"
import VIEWS from "components/Calendar/utils/constants"
// FIXME: Remove this random data
import events from "components/Calendar/utils/dummyData"
import Header from "components/Calendar/Views/Header"
import MonthlyView from "components/Calendar/Views/MonthlyView"
import YearlyView from "components/Calendar/Views/YearlyView"
import PropTypes from "prop-types"
import React, { useCallback, useReducer } from "react"
import { useHistory } from "react-router-dom"

/**
 * @param {Object[]} events - array of events in this form { title: string, url: string, start: Date, end: Date}
 * @param {string[]} views - what view types you want to use
 * @param {function} eventClick - what should happen when event is clicked on calendar
 * @param {function} dayClick - what should happen when a day is clicked on calendar
 * @param {object} colorScale - object in the form {low:number, mid:number, bgColor:string}
 *                              4 levels of tone for event count:  if = 0, if < low, if < mid, if > mid
 * @param {string} textColor - event title's text color "red" or "rgb(0,0,0)"
 */
const Calendar = ({
  events,
  views,
  eventClick,
  dayClick,
  colorScale,
  textColor
}) => {
  const [state, dispatch] = useReducer(reducer, initState)
  return (
    <div className="Calendar">
      <Header
        state={state}
        dispatch={dispatch}
        views={parseViewsOptions(views)}
      />
      {state.view === VIEWS.YEARLY && (
        <YearlyView
          viewYear={state.viewDate}
          events={events}
          eventClick={eventClick}
          dayClick={dayClick}
          textColor={textColor}
          colorScale={colorScale}
        />
      )}
      {state.view === VIEWS.MONTHLY && (
        <MonthlyView
          events={events}
          eventClick={eventClick}
          dayClick={dayClick}
          viewMonth={state.viewDate}
          weekStartsOn={1} // Monday
          colorScale={colorScale}
          textColor={textColor}
        />
      )}
    </div>
  )
}

Calendar.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  views: PropTypes.arrayOf(PropTypes.string),
  eventClick: PropTypes.func,
  dayClick: PropTypes.func,
  colorScale: PropTypes.object,
  textColor: PropTypes.string
}

// See which available views selected
function parseViewsOptions(views) {
  const parsedViews = Object.values(VIEWS).filter(view => views.includes(view))

  if (parsedViews.length === 0) {
    return ["Yearly", "Monthly"]
  }
  return parsedViews
}

// FIXME: remove this
export const CalendarWrapperToTest = () => {
  const views = ["Monthly", "Yearly"]
  const history = useHistory()
  const eventClickMemo = useCallback(event => history.push(event.url), [
    history
  ])
  const dayClickMemo = useCallback(
    dayInfo => console.log(dayInfo.dailyEvents),
    []
  )
  const colorScale = { low: 1, mid: 2, bgColor: "green" }
  const textColor = "black"

  return (
    <Calendar
      events={events}
      views={views}
      eventClick={eventClickMemo}
      dayClick={dayClickMemo}
      colorScale={colorScale}
      textColor={textColor}
    />
  )
}

export default Calendar
