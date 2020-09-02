import { changeActiveDate } from "components/Calendar/actions"
import events from "components/Calendar/utils/dummyData"
import reducer, { initState } from "components/Calendar/utils/reducer"
import Header from "components/Calendar/Views/Header"
import MonthlyView from "components/Calendar/Views/MonthlyView"
// import PropTypes from "prop-types"
import React, { useReducer } from "react"

const Calendar = () => {
  const [state, dispatch] = useReducer(reducer, initState)
  return (
    <div className="Calendar">
      <Header
        title={state.title}
        prevAction={() => state.prevAction(dispatch, state)}
        nextAction={() => state.nextAction(dispatch, state)}
        todayAction={() => dispatch(changeActiveDate(new Date()))}
        views={["Yearly", "Monthly"]}
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

// Calendar.propTypes = {
//   events: PropTypes.arrayOf(PropTypes.object),
//   views: PropTypes.object
// }
export default Calendar
