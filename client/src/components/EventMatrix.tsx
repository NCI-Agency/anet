import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { Event } from "models"
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
  // query variables for events, when query & pagination wanted:
  queryParams?: any
}

const EventMatrix = (props: EventMatrixProps) => {
  const [weekNumber, setWeekNumber] = useState(null)
  const [startDay, setStartDay] = useState(getFirstDayOfCurrentWeek())
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [weekDays, setWeekDays] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchEvents(eventQuery) {
      try {
        return await API.query(Event.getEventListQuery, {
          eventQuery
        })
      } catch (error) {
        setError(error)
      }
    }

    // Determine date range
    const week = []
    for (let i = 0; i <= 6; i++) {
      week.push(moment(startDay).add(i, "days").toDate())
    }
    setWeekDays(week)
    setWeekNumber(moment(startDay).week())

    // Get the events
    const eventQuery = Object.assign({}, props.queryParams)
    eventQuery.startDate = week[0]
    eventQuery.endDate = week[6]
    eventQuery.onlyWithTasks = true
    fetchEvents(eventQuery).then(response =>
      setEvents(response?.eventList?.list)
    )
  }, [startDay, props.queryParams])

  useEffect(() => {
    const tasksSet = new Set()
    const tasksArray = []
    events
      .map(event => event.tasks)
      .flat()
      .forEach(task => {
        if (!tasksSet.has(task.uuid)) {
          tasksSet.add(task.uuid)
          tasksArray.push(task)
        }
        tasksSet.add(task)
      })
    tasksArray.sort((a, b) => a.shortName.localeCompare(b.shortName))
    setTasks(tasksArray)
  }, [events])

  function getFirstDayOfCurrentWeek() {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    return new Date(today.setDate(diff))
  }

  function isEventIncluded(event, dateToCheck) {
    return (
      dateToCheck.getTime() >= event.startDate &&
      dateToCheck.getTime() <= event.endDate
    )
  }

  function showEventTitle(event, dateToCheck) {
    // True if event starts on this date or Monday
    return (
      new Date(event.startDate).toDateString() === dateToCheck.toDateString() ||
      dateToCheck.getDay() === 1
    )
  }

  function getEvent(task, dayOfWeek) {
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
            {events
              .filter(
                event =>
                  event.tasks.filter(t => t.uuid === task.uuid).length > 0
              )
              .map(event => (
                <tr key={event.uuid}>
                  {isEventIncluded(event, dateToCheck) && (
                    <td className="event-cell-color event-cell-height">
                      {showEventTitle(event, dateToCheck) && (
                        <LinkTo
                          className="event-cell-color ms-2 text-white"
                          modelType="Event"
                          model={event}
                        />
                      )}
                    </td>
                  )}
                  {!isEventIncluded(event, dateToCheck) && (
                    <td className="event-cell-height bg-white" />
                  )}
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
      <Messages error={error} />
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
        </div>
      </div>
      <div>
        <Table className="event-matrix" responsive hover id="events-matrix">
          <thead>
            <tr>
              <th />
              {weekDays.map(weekDay => (
                <th key={weekDay}>{weekDay.toISOString().slice(0, 10)}</th>
              ))}
            </tr>
            <tr>
              <th>{Settings.fields.task.shortLabel}</th>
              {weekDays.map(weekDay => (
                <th key={weekDay}>{dayNames[weekDay.getDay()]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.uuid}>
                <td>
                  <LinkTo modelType="Task" model={task} />
                </td>
                <td>{getEvent(task, 0)}</td>
                <td>{getEvent(task, 1)}</td>
                <td>{getEvent(task, 2)}</td>
                <td>{getEvent(task, 3)}</td>
                <td>{getEvent(task, 4)}</td>
                <td>{getEvent(task, 5)}</td>
                <td>{getEvent(task, 6)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {events.length === 0 && <em>No events in this week </em>}
      </div>
    </>
  )
}

export default EventMatrix
