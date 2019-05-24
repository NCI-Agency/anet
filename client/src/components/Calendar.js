import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import bootstrapPlugin from "@fullcalendar/bootstrap"
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
        slotDuration={{ hours: 2 }}
        header={{
          left: "prev,next today filterDraft",
          center: "title",
          right:
            "dayGridMonth,timeGridWeek,timeGridDay,listMonth,listWeek,listDay"
        }}
        bootstrapFontAwesome={{
          close: "fa-times",
          prev: "fa-chevron-left",
          next: "fa-chevron-right",
          prevYear: "fa-angle-double-left",
          nextYear: "fa-angle-double-right"
        }}
        buttonText={{
          //          prev: "<",
          //          next: ">",
          listMonth: "list month",
          listWeek: "list week",
          listDay: "list day"
        }}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
          interactionPlugin,
          bootstrapPlugin
        ]}
        events={events}
        eventRender={eventRender}
        ref={calendarComponentRef}
        allDayDefault
        eventOverlap
        dateClick={info => {
          let calendarApi = calendarComponentRef.current.getApi()
          calendarApi.changeView("timeGridDay", info.dateStr) // call a method on the Calendar object
        }}
        eventClick={eventInfo => {}}
        height="auto"
        themeSystem="bootstrap"
        views={{
          timeGridWeek: {
            eventLimit: 2,
            eventLimitClick: "day"
          },
          dayGrid: {
            eventLimit: 2,
            eventLimitClick: "popover"
          }
        }}
      />
    )
  }
}
