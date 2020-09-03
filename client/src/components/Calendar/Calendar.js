// import PropTypes from "prop-types"
import { changeViewDate } from "components/Calendar/actions"
import VIEWS from "components/Calendar/utils/constants"
// FIXME: Make this input
import events from "components/Calendar/utils/dummyData"
import reducer, { initState } from "components/Calendar/utils/reducer"
import Header from "components/Calendar/Views/Header"
import MonthlyView from "components/Calendar/Views/MonthlyView"
import YearlyView from "components/Calendar/Views/YearlyView"
import React, { useCallback, useReducer } from "react"
import { useHistory } from "react-router-dom"

const Calendar = () => {
  // FIXME: make this input
  const views = ["Monthly", "Yearly"]
  // FIXME: make this input
  const history = useHistory()
  const eventClickMemo = useCallback(event => history.push(event.url), [
    history
  ])
  const [state, dispatch] = useReducer(reducer, initState)
  return (
    <div className="Calendar">
      <Header
        title={state.title}
        prevAction={() => state.prevAction(dispatch, state)}
        nextAction={() => state.nextAction(dispatch, state)}
        todayAction={() => dispatch(changeViewDate(new Date()))}
        views={parseViewsOptions()}
      />
      <MonthlyView
        viewMonth={state.viewDate}
        selectedDay={state.selectedDay}
        dispatcher={dispatch}
        events={events}
        eventClick={eventClickMemo}
      />
      <YearlyView
        viewYear={state.viewDate}
        events={events}
        eventClick={eventClickMemo}
      />
    </div>
  )
  // See which available views selected
  function parseViewsOptions() {
    return Object.values(VIEWS).filter(view => views.includes(view))
  }
}

// Calendar.propTypes = {
//   events: PropTypes.arrayOf(PropTypes.object),
//   views: PropTypes.object
// }
export default Calendar
