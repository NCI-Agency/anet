import { changeActiveDate } from "Calendar/actions"
import reducer, { initState } from "Calendar/utils/reducer"
import Header from "Calendar/Views/Header"
import MonthlyView from "Calendar/Views/MonthlyView"
import PropTypes from "prop-types"
import React, { useReducer } from "react"

const Calendar = ({ events, views }) => {
  const [state, dispatch] = useReducer(reducer, initState)
  return (
    <div className="Calendar">
      <Header
        title={state.title}
        prevAction={() => state.prevAction(dispatch, state)}
        nextAction={() => state.nextAction(dispatch, state)}
        todayAction={() => dispatch(changeActiveDate(new Date()))}
      />
      <MonthlyView
        activeMonth={state.activeDate}
        selectedDay={state.selectedDay}
        dispatcher={dispatch}
        events={events}
      />
    </div>
  )
}

Calendar.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object),
  views: PropTypes.object
}
export default Calendar
