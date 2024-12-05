import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import _isEmpty from "lodash/isEmpty"
import { Event, EventSeries } from "models"
import moment from "moment/moment"
import React, { useEffect, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

interface EventMatrixProps {
  pageDispatchers?: PageDispatchersPropType
  // query variables for events, when query & pagination wanted:
  queryParams: any
  tasks: any[]
}

const EventMatrix = ({
  pageDispatchers,
  queryParams,
  tasks
}: EventMatrixProps) => {
  const [weekNumber, setWeekNumber] = useState(null)
  const [startDay, setStartDay] = useState(getFirstDayOfCurrentWeek())
  const [events, setEvents] = useState([])
  const [weekDays, setWeekDays] = useState([])
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    // Determine date range
    const week = []
    for (let i = 0; i <= 6; i++) {
      week.push(moment(startDay).add(i, "days").toDate())
    }
    setWeekDays(week)
    setWeekNumber(moment(startDay).week())
  }, [startDay])

  useEffect(() => {
    async function fetchEvents(eventQuery) {
      try {
        return await API.query(Event.getEventListQuery, {
          eventQuery
        })
      } catch (error) {
        setFetchError(error)
      }
    }

    // Get the events
    const eventQuery = {
      ...queryParams,
      pageSize: 0,
      startDate: weekDays[0],
      endDate: weekDays[6]
    }
    fetchEvents(eventQuery).then(response =>
      setEvents(response?.eventList?.list)
    )
  }, [weekDays, queryParams])

  const eventSeriesQuery = {
    pageSize: 0
  }
  const { loading, error, data } = API.useApiQuery(
    EventSeries.getEventSeriesListQuery,
    {
      eventSeriesQuery
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }
  const eventSeries = data.eventSeriesList?.list

  function getFirstDayOfCurrentWeek() {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    return new Date(today.setDate(diff))
  }

  function isEventIncluded(event, dateToCheck) {
    return (
      moment(event.startDate).startOf("day").isBefore(dateToCheck) &&
      moment(event.endDate).endOf("day").isAfter(dateToCheck)
    )
  }

  function showEventTitle(event, dateToCheck) {
    // True if event starts on this date or Monday
    return (
      new Date(event.startDate).toDateString() === dateToCheck.toDateString() ||
      dateToCheck.getDay() === 1
    )
  }

  function getEvent(events, dayOfWeek) {
    // Get the date
    const dateToCheck = new Date(weekDays[dayOfWeek])
    return (
      <>
        <Table
          responsive
          borderless
          hover
          id={dayOfWeek}
          className="event-matrix-cell mb-0"
        >
          <tbody>
            {events.map(event => (
              <tr key={event.uuid}>
                {(isEventIncluded(event, dateToCheck) && (
                  <td className="event-cell-color event-cell-height">
                    {showEventTitle(event, dateToCheck) && (
                      <LinkTo
                        className="event-cell-color ms-2 text-white"
                        modelType="Event"
                        model={event}
                      />
                    )}
                  </td>
                )) || <td className="event-cell-height bg-white" />}
              </tr>
            ))}
          </tbody>
        </Table>
      </>
    )
  }

  function showPreviousPeriod() {
    setStartDay(moment(startDay).subtract(7, "days").toDate())
  }

  function showNextPeriod() {
    setStartDay(moment(startDay).add(7, "days").toDate())
  }

  return (
    <>
      <Messages error={fetchError} />
      <div className="float-start">
        <div className="rollup-date-range-container">
          <Button
            id="previous-period"
            onClick={() => showPreviousPeriod()}
            variant="outline-secondary"
            className="me-1"
          >
            <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />
          </Button>
          Events in week {weekNumber}
          <Button
            id="next-period"
            onClick={() => showNextPeriod()}
            variant="outline-secondary"
            className="ms-1"
          >
            <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
          </Button>
          {_isEmpty(events) && (
            <em className="ms-2 text-info">No events in this week </em>
          )}
        </div>
      </div>
      <div>
        <Table className="event-matrix" responsive hover id="events-matrix">
          <tbody>
            <tr className="table-primary">
              <th>Event Series</th>
              {weekDays.map(weekDay => (
                <th key={weekDay}>
                  {weekDay.toISOString().slice(0, 10)}
                  <br />
                  {dayNames[weekDay.getDay()]}
                </th>
              ))}
            </tr>
            {(_isEmpty(eventSeries) && (
              <tr>
                <td colSpan={8}>No matching Event Series</td>
              </tr>
            )) ||
              eventSeries.map(eventSerie => {
                const eventSeriesEvents = events.filter(
                  e => e.eventSeries?.uuid === eventSerie.uuid
                )
                return (
                  <tr key={eventSerie.uuid}>
                    <td>
                      <LinkTo modelType="EventSeries" model={eventSerie} />
                    </td>
                    <td>{getEvent(eventSeriesEvents, 0)}</td>
                    <td>{getEvent(eventSeriesEvents, 1)}</td>
                    <td>{getEvent(eventSeriesEvents, 2)}</td>
                    <td>{getEvent(eventSeriesEvents, 3)}</td>
                    <td>{getEvent(eventSeriesEvents, 4)}</td>
                    <td>{getEvent(eventSeriesEvents, 5)}</td>
                    <td>{getEvent(eventSeriesEvents, 6)}</td>
                  </tr>
                )
              })}
            <tr className="table-primary">
              <th>{Settings.fields.task.shortLabel}</th>
              {weekDays.map(weekDay => (
                <th key={weekDay}>
                  {weekDay.toISOString().slice(0, 10)}
                  <br />
                  {dayNames[weekDay.getDay()]}
                </th>
              ))}
            </tr>
            {(_isEmpty(tasks) && (
              <tr>
                <td colSpan={8}>
                  No matching {Settings.fields.task.shortLabel}
                </td>
              </tr>
            )) ||
              tasks.map(task => {
                const taskEvents = events.filter(e =>
                  e.tasks?.find(t => t.uuid === task.uuid)
                )
                return (
                  <tr key={task.uuid}>
                    <td>
                      <BreadcrumbTrail
                        modelType="Task"
                        leaf={task}
                        ascendantObjects={task.ascendantTasks}
                        parentField="parentTask"
                      />
                    </td>
                    <td>{getEvent(taskEvents, 0)}</td>
                    <td>{getEvent(taskEvents, 1)}</td>
                    <td>{getEvent(taskEvents, 2)}</td>
                    <td>{getEvent(taskEvents, 3)}</td>
                    <td>{getEvent(taskEvents, 4)}</td>
                    <td>{getEvent(taskEvents, 5)}</td>
                    <td>{getEvent(taskEvents, 6)}</td>
                  </tr>
                )
              })}
          </tbody>
        </Table>
      </div>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventMatrix)
