import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import _isEmpty from "lodash/isEmpty"
import moment from "moment/moment"
import React, { useEffect, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GET_TASKS = gql`
  query ($taskUuid: String, $includeTask: Boolean!) {
    task(uuid: $taskUuid) @include(if: $includeTask) {
      uuid
      shortName
      selectable
      status
      ascendantTasks {
        uuid
        shortName
        parentTask {
          uuid
        }
      }
      descendantTasks {
        uuid
        shortName
        selectable
        status
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
      }
    }
  }
`

const GET_EVENTS_AND_REPORTS = gql`
  query (
    $eventQuery: EventSearchQueryInput
    $reportQuery: ReportSearchQueryInput
  ) {
    eventList(query: $eventQuery) {
      totalCount
      list {
        uuid
        name
        startDate
        endDate
        status
        eventSeries {
          uuid
          status
        }
        tasks {
          uuid
        }
      }
    }

    reportList(query: $reportQuery) {
      totalCount
      list {
        uuid
        intent
        engagementDate
        event {
          uuid
          startDate
          endDate
          tasks {
            uuid
          }
        }
        tasks {
          uuid
        }
      }
    }
  }
`

const nextDay = date => moment(date).add(1, "day")
const hasTask = (tasks, task) => !!tasks?.find(t => t.uuid === task?.uuid)

interface EventMatrixProps {
  pageDispatchers?: PageDispatchersPropType
  taskUuid: string
  tasks: any[]
  eventSeries?: any[]
}

const EventMatrix = ({
  pageDispatchers,
  taskUuid,
  tasks,
  eventSeries
}: EventMatrixProps) => {
  const [weekNumber, setWeekNumber] = useState(null)
  const [startDay, setStartDay] = useState(moment().startOf("week"))
  const [events, setEvents] = useState([])
  const [reports, setReports] = useState([])
  const [weekDays, setWeekDays] = useState([])
  const [fetchError, setFetchError] = useState(null)
  const includeTask = !!taskUuid

  useEffect(() => {
    // Determine date range
    const week = []
    for (let i = 0; i <= 6; i++) {
      week.push(moment(startDay).add(i, "days"))
    }
    setWeekDays(week)
    setWeekNumber(startDay.week())
  }, [startDay])

  useEffect(() => {
    async function fetchEventsAndReports(eventQuery, reportQuery) {
      try {
        return await API.query(GET_EVENTS_AND_REPORTS, {
          eventQuery,
          reportQuery
        })
      } catch (error) {
        setFetchError(error)
      }
    }

    // Get the events
    if (_isEmpty(weekDays)) {
      return
    }
    const isoStartDate = weekDays[0].toISOString()
    const isoEndDate = moment(weekDays[6]).endOf("day").toISOString()
    const eventQuery = {
      pageSize: 0,
      startDate: isoStartDate,
      endDate: isoEndDate
    }
    const reportQuery = {
      taskUuid: taskUuid ? [taskUuid] : (tasks?.map(t => t.uuid) ?? []),
      pageSize: 0,
      engagementDateStart: isoStartDate,
      engagementDateEnd: isoEndDate
    }
    fetchEventsAndReports(eventQuery, reportQuery).then(response => {
      if (eventSeries !== null) {
        setEvents(response?.eventList?.list)
      }
      setReports(response?.reportList?.list)
    })
  }, [weekDays, taskUuid, tasks, eventSeries])

  const { loading, error, data } = API.useApiQuery(GET_TASKS, {
    taskUuid,
    includeTask
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }
  const topLevelTask = data.task
  const allTasks = (
    includeTask ? [topLevelTask].concat(topLevelTask?.descendantTasks) : tasks
  ).filter(t => t.selectable)
  // if topLevelTask task is not in allTasks, add it at the top
  if (includeTask && !hasTask(allTasks, topLevelTask)) {
    allTasks.unshift(topLevelTask)
  }

  function isReportIncluded(report, startDate, endDate, task, event?) {
    if (
      !(
        moment(report.engagementDate).startOf("day").isBefore(endDate) &&
        moment(report.engagementDate).endOf("day").isSameOrAfter(startDate)
      )
    ) {
      // Out of range
      return false
    }
    if (!hasTask(report.tasks, task)) {
      // Not related to the current task
      return false
    }
    if (!event) {
      // Not related to an event
      return true
    }
    if (
      isEventIncluded(event, startDate, endDate) &&
      hasTask(event.tasks, task)
    ) {
      // Already shown under the event
      return false
    }
    return true
  }

  function isEventIncluded(event, startDate, endDate) {
    return (
      moment(event.startDate).startOf("day").isBefore(endDate) &&
      moment(event.endDate).endOf("day").isSameOrAfter(startDate)
    )
  }

  function showEventTitle(event, dateToCheck) {
    // True if event starts on this date, or it is the first day of the week
    return (
      moment(event.startDate).startOf("day").isSame(dateToCheck) ||
      dateToCheck.isSame(startDay)
    )
  }

  function getEventHeight(event, task?) {
    let maxEventTasks = 0
    if (task) {
      for (const dateToCheck of weekDays) {
        const eventReports =
          reports?.filter(
            r =>
              isReportIncluded(r, dateToCheck, nextDay(dateToCheck), task) &&
              r.event?.uuid === event.uuid
          ) ?? []
        maxEventTasks = Math.max(maxEventTasks, eventReports.length)
      }
    }
    // Ugly way to calculate the (max) height for this event
    return `${(maxEventTasks + 1) * 18 * 1.33 + maxEventTasks * 4 + 16}px`
  }

  function getEvent(events, dayOfWeek, task?) {
    // Get the date
    const dateToCheck = weekDays[dayOfWeek]
    const taskReports = task
      ? reports?.filter(
          r =>
            isReportIncluded(
              r,
              dateToCheck,
              nextDay(dateToCheck),
              task,
              r.event
            ) && hasTask(r.tasks, task)
        )
      : []
    return (
      <Table
        responsive
        borderless
        hover
        id={dayOfWeek}
        className="event-matrix-cell mb-0"
      >
        <tbody>
          {events.map(event => {
            const eventReports = task
              ? reports?.filter(
                  r =>
                    isReportIncluded(
                      r,
                      dateToCheck,
                      nextDay(dateToCheck),
                      task
                    ) && r.event?.uuid === event.uuid
                )
              : []
            const eventHeight = getEventHeight(event, task)
            return (
              <tr key={event.uuid} style={{ height: `${eventHeight}` }}>
                {isEventIncluded(event, dateToCheck, nextDay(dateToCheck)) && (
                  <td className="event-cell">
                    {(showEventTitle(event, dateToCheck) && (
                      <LinkTo
                        className="ms-2 text-white fw-bolder ellipsized-text"
                        modelType="Event"
                        model={event}
                        tooltipProps={{ className: "mw-100" }}
                      />
                    )) || (
                      <span className="fw-bolder ellipsized-text">&nbsp;</span>
                    )}
                    {eventReports?.map(report => (
                      <div
                        key={report.uuid}
                        className="clearfix event-report-cell"
                      >
                        <LinkTo
                          className="ellipsized-text"
                          modelType="Report"
                          model={report}
                          tooltipProps={{ className: "mw-100" }}
                        />
                      </div>
                    ))}
                  </td>
                )}
              </tr>
            )
          })}
          {taskReports?.map(report => (
            <tr key={report.uuid}>
              <td className="task-report-cell">
                <LinkTo
                  className="ellipsized-text"
                  modelType="Report"
                  model={report}
                  tooltipProps={{ className: "mw-100" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }

  function showPreviousPeriod() {
    setStartDay(moment(startDay).subtract(7, "days"))
  }

  function showNextPeriod() {
    setStartDay(moment(startDay).add(7, "days"))
  }

  function isEventSeriesIncluded(eventSeries: any) {
    if (eventSeries?.status === Model.STATUS.ACTIVE) {
      // Active eventSeries are always included
      return true
    }

    // Inactive eventSeries are only shown if they have events
    const endDay = moment(startDay).add(7, "days")
    return !!events?.find(event => {
      return (
        event?.eventSeries?.uuid === eventSeries?.uuid &&
        isEventIncluded(event, startDay, endDay)
      )
    })
  }

  function isTaskIncluded(task: any) {
    if (
      task?.status === Model.STATUS.ACTIVE ||
      task?.uuid === topLevelTask?.uuid ||
      hasTask(tasks, task)
    ) {
      // Active tasks, top-level task and assigned tasks are always included
      return true
    }

    // Inactive tasks are only shown if they have events
    if (events?.find(e => hasTask(e.tasks, task))) {
      return true
    }

    //  or reports
    const endDay = moment(startDay).add(7, "days")
    return !!reports?.find(
      r =>
        isReportIncluded(r, startDay, endDay, task, r.event) &&
        hasTask(r.tasks, task)
    )
  }

  let emptyMsg: string
  if (_isEmpty(events) && _isEmpty(reports)) {
    emptyMsg = "events or reports"
  } else if (_isEmpty(events)) {
    emptyMsg = "events"
  } else if (_isEmpty(reports)) {
    emptyMsg = "reports"
  }
  const emptyMsgComponent = emptyMsg ? (
    <em className="ms-2 text-info">No {emptyMsg} this week</em>
  ) : null

  const includedEventSeries = eventSeries.filter(isEventSeriesIncluded)
  const includedTasks = allTasks.filter(isTaskIncluded)

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
          {emptyMsgComponent}
        </div>
      </div>
      <div>
        <Table className="event-matrix" responsive hover id="events-matrix">
          <tbody>
            <tr id="event-series-table-header" className="table-primary">
              <th>Event Series</th>
              {weekDays.map(weekDay => (
                <th key={weekDay} style={{ width: "12%" }}>
                  {weekDay.format("YYYY-MM-DD")}
                  <br />
                  {weekDay.format("dddd")}
                </th>
              ))}
            </tr>
            {(_isEmpty(includedEventSeries) && (
              <tr className="event-series-row">
                <td colSpan={8}>No matching Event Series</td>
              </tr>
            )) ||
              includedEventSeries.map(es => {
                const eventSeriesEvents = events.filter(
                  e => e.eventSeries?.uuid === es.uuid
                )
                return (
                  <tr key={es.uuid} className="event-series-row">
                    <td>
                      <LinkTo modelType="EventSeries" model={es} />
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
            <tr id="tasks-table-header" className="table-primary">
              <th>{Settings.fields.task.shortLabel}</th>
              {weekDays.map(weekDay => (
                <th key={weekDay} style={{ width: "12%" }}>
                  {weekDay.format("YYYY-MM-DD")}
                  <br />
                  {weekDay.format("dddd")}
                </th>
              ))}
            </tr>
            {(_isEmpty(includedTasks) && (
              <tr className="event-series-task-row">
                <td colSpan={8}>
                  No matching {Settings.fields.task.shortLabel}
                </td>
              </tr>
            )) ||
              includedTasks.map(task => {
                const taskEvents = events.filter(e => hasTask(e.tasks, task))
                return (
                  <tr key={task.uuid} className="event-series-task-row">
                    <td>
                      <BreadcrumbTrail
                        modelType="Task"
                        leaf={task}
                        ascendantObjects={task.ascendantTasks}
                        parentField="parentTask"
                        hideParents={includeTask && taskUuid !== task.uuid}
                        ascendantTask={topLevelTask}
                      />
                    </td>
                    <td>{getEvent(taskEvents, 0, task)}</td>
                    <td>{getEvent(taskEvents, 1, task)}</td>
                    <td>{getEvent(taskEvents, 2, task)}</td>
                    <td>{getEvent(taskEvents, 3, task)}</td>
                    <td>{getEvent(taskEvents, 4, task)}</td>
                    <td>{getEvent(taskEvents, 5, task)}</td>
                    <td>{getEvent(taskEvents, 6, task)}</td>
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
