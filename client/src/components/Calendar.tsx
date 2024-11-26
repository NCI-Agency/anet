// needs to be imported first, before plugins:
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
// needed for dayClick:
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import timeGridPlugin from "@fullcalendar/timegrid"
import React from "react"
import "./Calendar.css"

interface CalendarProps {
  events: (...args: unknown[]) => unknown
  eventClick: (...args: unknown[]) => unknown
  calendarComponentRef?: {
    current?: (...args: unknown[]) => unknown
  }
}

const Calendar = ({
  events,
  eventClick,
  calendarComponentRef
}: CalendarProps) => (
  <FullCalendar
    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
    headerToolbar={{
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listDay"
    }}
    buttonText={{
      listDay: "list day"
    }}
    initialView="dayGridMonth"
    views={{
      timeGridWeek: {
        moreLinkClick: "day"
      },
      dayGrid: {
        moreLinkClick: "popover"
      }
    }}
    defaultAllDay={false}
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
    fixedWeekCount={false}
    ref={calendarComponentRef}
    // set an absolute max; workaround for https://github.com/fullcalendar/fullcalendar/issues/5595
    dayMaxEvents={2}
    // assume events are sorted already; workaround for https://github.com/fullcalendar/fullcalendar/issues/7462
    eventOrder={[]}
    eventMaxStack={3}
    events={events}
    eventOverlap
    eventDisplay="block"
    eventClick={eventClick}
    dateClick={info => {
      const calendarApi = calendarComponentRef.current.getApi()
      calendarApi.changeView("listDay", info.dateStr) // call a method on the Calendar object
    }}
  />
)

export default Calendar
