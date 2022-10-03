// needs to be imported first, before plugins:
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes,
  GET_CALENDAR_EVENTS_FROM
} from "components/aggregations/utils"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useRef } from "react"
import { useNavigate } from "react-router-dom"
import "../Calendar.css"

const DATE_FORMAT = "YYYY-MM-DD"

const CalendarWidget = ({
  values,
  valueType,
  period,
  whenUnspecified,
  hasPrevNext
}) => {
  const calendarComponentRef = useRef(null)
  const events = GET_CALENDAR_EVENTS_FROM[valueType]?.(values)
  const navigate = useNavigate()
  if (_isEmpty(events)) {
    return whenUnspecified
  }
  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      headerToolbar={{
        left: hasPrevNext ? "prev,next" : "",
        center: "title",
        right: ""
      }}
      initialView="dayGridMonth"
      initialDate={period.start.format(DATE_FORMAT)}
      defaultAllDay
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
      ref={calendarComponentRef}
      events={events}
      eventClick={info => {
        navigate(info.event.url)
        // Prevent browser navigation to the url
        info.jsEvent.preventDefault()
      }}
      eventOverlap
    />
  )
}
CalendarWidget.propTypes = {
  hasPrevNext: PropTypes.bool,
  ...aggregationWidgetPropTypes
}
CalendarWidget.defaultProps = {
  hasPrevNext: false,
  ...aggregationWidgetDefaultProps
}

export default CalendarWidget
