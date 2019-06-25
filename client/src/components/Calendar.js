import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import "@fullcalendar/core/main.css"
import "@fullcalendar/daygrid/main.css"
import "@fullcalendar/timegrid/main.css"
import "@fullcalendar/list/main.css"
import "./Calendar.css"

import React, { Component } from "react"

export default class Calendar extends Component {
  render() {
    const { events, calendarComponentRef, eventRender } = this.props
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
        height="auto" // assume a natural height, no scrollbars will be used
        aspectRatio={3} // ratio of width-to-height
        ref={calendarComponentRef}
        events={events}
        eventRender={eventRender}
        eventOverlap
        eventLimit
        eventClick={eventInfo => {}}
        dateClick={info => {
          let calendarApi = calendarComponentRef.current.getApi()
          calendarApi.changeView("listDay", info.dateStr) // call a method on the Calendar object
        }}
      />
    )
  }
}
