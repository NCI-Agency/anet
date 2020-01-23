import "@fullcalendar/core/main.css"
import dayGridPlugin from "@fullcalendar/daygrid"
import "@fullcalendar/daygrid/main.css"
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import listPlugin from "@fullcalendar/list"
import "@fullcalendar/list/main.css"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import "@fullcalendar/timegrid/main.css"
import PropTypes from "prop-types"
import React from "react"
import "./Calendar.css"

const Calendar = ({ events, eventClick, calendarComponentRef }) => {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      header={{
        left: "prev,next today filterDraft",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listDay"
      }}
      buttonText={{
        listDay: "list day"
      }}
      defaultView="dayGridMonth"
      views={{
        timeGridWeek: {
          eventLimitClick: "day"
        },
        dayGrid: {
          eventLimitClick: "popover"
        }
      }}
      allDayDefault={false}
      eventTimeFormat={{
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
        omitZeroMinute: false,
        hour12: false
      }}
      slotLabelFormat={{
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
        omitZeroMinute: false,
        hour12: false
      }}
      height="auto" // assume a natural height, no scrollbars will be used
      aspectRatio={3} // ratio of width-to-height
      timeGridEventMinHeight={20}
      ref={calendarComponentRef}
      events={events}
      eventOverlap
      eventLimit
      eventClick={eventClick}
      dateClick={info => {
        const calendarApi = calendarComponentRef.current.getApi()
        calendarApi.changeView("listDay", info.dateStr) // call a method on the Calendar object
      }}
    />
  )
}

Calendar.propTypes = {
  events: PropTypes.func.isRequired,
  eventClick: PropTypes.func.isRequired,
  calendarComponentRef: PropTypes.shape({
    current: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  })
}

export default Calendar
