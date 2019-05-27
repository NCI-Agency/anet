import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import "@fullcalendar/core/main.css"
import "@fullcalendar/daygrid/main.css"
import "@fullcalendar/timegrid/main.css"
import "@fullcalendar/list/main.css"
import "font-awesome/css/font-awesome.min.css"

import React, { Component } from "react"

export default class Calendar extends Component {
  render() {
    const { events, calendarComponentRef, eventRender } = this.props
    return (
      <FullCalendar
        defaultView="dayGridMonth"
        header={{
          left: "prev,next today filterDraft",
          center: "title",
          right:
            "dayGridMonth,timeGridWeek,timeGridDay,listDay"
        }}
        buttonText={{
          listDay: "list day"
        }}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        events={events}
        eventRender={eventRender}
        ref={calendarComponentRef}
        allDayDefault={false}
        eventOverlap
        eventLimit
        dateClick={info => {
          let calendarApi = calendarComponentRef.current.getApi()
          calendarApi.changeView("timeGridDay", info.dateStr) // call a method on the Calendar object
        }}
        eventClick={eventInfo => {}}
        height="auto"
        views={{
          timeGridWeek: {
            eventLimitClick: "day"
          },
          dayGrid: {
            eventLimitClick: "popover"
          }
        }}
      />
    )
  }
}
