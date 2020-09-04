import VIEWS from "components/Calendar/utils/constants"
// FIXME: Remove this random data
import events from "components/Calendar/utils/dummyData"
import reducer, { initState } from "components/Calendar/utils/reducer"
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
 */
const Calendar = ({ events, views, eventClick }) => {
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
        />
      )}
      {state.view === VIEWS.MONTHLY && (
        <MonthlyView
          viewMonth={state.viewDate}
          selectedDay={state.selectedDay}
          dispatcher={dispatch}
          events={events}
          eventClick={eventClick}
        />
      )}
    </div>
  )
}

Calendar.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  views: PropTypes.arrayOf(PropTypes.string),
  eventClick: PropTypes.func
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
export const CalendarWrapper = () => {
  const views = ["Monthly", "Yearly"]
  const history = useHistory()
  const eventClickMemo = useCallback(event => history.push(event.url), [
    history
  ])
  return <Calendar events={events} eventClick={eventClickMemo} views={views} />
}

export default Calendar
