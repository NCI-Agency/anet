import {
  gqlAllTaskFields,
  gqlEntityFieldsMap,
  gqlPreferenceFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { buildTree } from "components/advancedSelectWidget/utils"
import AppContext from "components/AppContext"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { debounce } from "lodash"
import _isEmpty from "lodash/isEmpty"
import moment from "moment/moment"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_PREFERENCES = gql`
  query {
    preferences {
      ${gqlPreferenceFields}
    }
  }
`

const GET_TASKS = gql`
  query ($taskUuid: String, $includeTask: Boolean!) {
    task(uuid: $taskUuid) @include(if: $includeTask) {
      ${gqlAllTaskFields}
      parentTask {
        ${gqlEntityFieldsMap.Task}
      }
      ascendantTasks {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
      }
      descendantTasks {
        ${gqlEntityFieldsMap.Task}
        selectable
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
        ascendantTasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
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
        ${gqlEntityFieldsMap.Event}
        startDate
        endDate
        eventSeries {
          ${gqlEntityFieldsMap.EventSeries}
        }
        tasks {
          ${gqlEntityFieldsMap.Task}
        }
      }
    }

    reportList(query: $reportQuery) {
      totalCount
      list {
        ${gqlEntityFieldsMap.Report}
        event {
          ${gqlEntityFieldsMap.Event}
          startDate
          endDate
          tasks {
            ${gqlEntityFieldsMap.Task}
          }
        }
        tasks {
          ${gqlEntityFieldsMap.Task}
        }
      }
    }
  }
`

const nextDay = date => moment(date).add(1, "day")
const hasTask = (tasks, task) => !!tasks?.find(t => t.uuid === task?.uuid)
const sortTasksAndAddLevel = (tasks, level = 0) => {
  const tasksArray = Array.from(tasks.values())
  tasksArray.sort((a, b) => {
    return (
      a.shortName.localeCompare(b.shortName) || a.uuid.localeCompare(b.uuid)
    )
  })
  for (const task of tasksArray) {
    task.level = level
    if (task.children) {
      task.children = sortTasksAndAddLevel(task.children, level + 1)
    }
  }
  return tasksArray
}
const addTaskToList = (task, taskList) => {
  taskList.push(task)
  for (const childTask of task.children || []) {
    addTaskToList(childTask, taskList)
  }
}

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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const { currentUser, appSettings } = useContext(AppContext)
  const [periodLengthInDays, setPeriodLengthInDays] = useState<number>(5)
  const [periodStartDay, setPeriodStartDay] = useState(moment().startOf("day"))
  const [periodDays, setPeriodDays] = useState([])
  const [events, setEvents] = useState([])
  const [reports, setReports] = useState([])
  const [fetchError, setFetchError] = useState(null)
  const includeTask = !!taskUuid

  useEffect(() => {
    const loadPreferences = async () => {
      const userPreference = currentUser.preferences?.find(
        p =>
          p.preference?.name === "SYNC_MATRIX_PERIOD" &&
          p.preference?.category === "sync-matrix"
      )
      if (userPreference) {
        setPeriodLengthInDays(userPreference.value)
      } else {
        try {
          const genericPreferences = await API.query(GQL_GET_PREFERENCES, {})
          const genericPreference = genericPreferences.preferences.find(
            p => p.name === "SYNC_MATRIX_PERIOD" && p.category === "sync-matrix"
          )
          setPeriodLengthInDays(genericPreference.defaultValue)
        } catch (err) {
          console.error(err)
          setFetchError("Failed to load preferences.")
        }
      }
    }
    loadPreferences()
  }, [currentUser])

  function shiftPeriod(days: number) {
    setPeriodStartDay(prev => moment(prev).add(days, "days"))
  }

  useEffect(() => {
    const period = []
    for (let i = 0; i < periodLengthInDays; i++) {
      period.push(moment(periodStartDay).add(i, "days"))
    }
    setPeriodDays(period)
  }, [periodStartDay, periodLengthInDays])

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

    if (_isEmpty(periodDays) || !periodLengthInDays) {
      return
    }

    const isoStartDate = periodDays[0].startOf("day").toISOString()
    const isoEndDate = moment(periodDays[periodLengthInDays - 1])
      .endOf("day")
      .toISOString()

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
  }, [periodDays, taskUuid, tasks, eventSeries])

  const updatePeriod = useMemo(
    () => debounce(value => setPeriodLengthInDays(value), 500),
    []
  )

  const { loading, error, data } = API.useApiQuery(GET_TASKS, {
    taskUuid,
    includeTask
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const [allTasks, topLevelTaskUuids] = useMemo(() => {
    if (done) {
      return []
    }
    const topLevelTask = data.task
    const topLevelTasks = topLevelTask ? [topLevelTask] : tasks || []

    const treeMap = buildTree(
      "ascendantTasks",
      "descendantTasks",
      "parentTask",
      topLevelTasks
    )
    const rootLevelTasks = topLevelTask
      ? topLevelTasks
      : Object.values(treeMap).filter(t => _isEmpty(t.parents))
    const rootLevelTaskUuids = new Set<string>(rootLevelTasks.map(t => t.uuid))
    const allTasksUuids = new Set<string>(topLevelTasks.map(t => t.uuid))
    const newRootTasks = topLevelTasks
      // Add the root locations directly included in the items
      .filter(t => rootLevelTaskUuids.has(t.uuid))
      // Append the root locations not directly included in the items
      .concat(rootLevelTasks.filter(t => !allTasksUuids.has(t.uuid)))
      .map(t => treeMap[t.uuid])
    const sortedTasksWithLevel = sortTasksAndAddLevel(newRootTasks)
    // Now flatten the list
    const allTasks = []
    for (const task of sortedTasksWithLevel) {
      addTaskToList(task, allTasks)
    }
    return [allTasks, rootLevelTaskUuids]
  }, [data, done, tasks])

  if (done) {
    return result
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
    // True if event starts on this date, or it is the first day of the period
    return (
      moment(event.startDate).startOf("day").isSame(dateToCheck) ||
      dateToCheck.isSame(periodStartDay)
    )
  }

  function getEventHeight(event, task?) {
    let maxEventTasks = 0
    if (task) {
      for (const dateToCheck of periodDays) {
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

  function getEvent(events, dayOfPeriod, task?) {
    // Get the date
    const dateToCheck = periodDays[dayOfPeriod]
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
        id={dayOfPeriod}
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

  function isEventSeriesIncluded(eventSeries: any) {
    if (eventSeries?.status === Model.STATUS.ACTIVE) {
      // Active eventSeries are always included
      return true
    }

    // Inactive eventSeries are only shown if they have events
    const endDay = moment(periodStartDay).add(periodLengthInDays, "days")
    return !!events?.find(event => {
      return (
        event?.eventSeries?.uuid === eventSeries?.uuid &&
        isEventIncluded(event, periodStartDay, endDay)
      )
    })
  }

  function isTaskIncluded(task: any) {
    if (
      task?.status === Model.STATUS.ACTIVE ||
      topLevelTaskUuids?.has(task?.uuid) ||
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
    const endDay = moment(periodStartDay).add(7, "days")

    return !!reports?.find(
      r =>
        isReportIncluded(r, periodStartDay, endDay, task, r.event) &&
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
    <em className="ms-2 text-info">No {emptyMsg} this period</em>
  ) : null

  const includedEventSeries = eventSeries.filter(isEventSeriesIncluded)
  const includedTasks = allTasks.filter(isTaskIncluded)

  return (
    <>
      <Messages error={fetchError} />
      <div className="float-start">
        <div className="rollup-date-range-container d-flex align-items-end gap-2">
          <div className="form-group" style={{ width: "170px" }}>
            <label className="form-label">Period in days</label>
            <input
              type="number"
              min={1}
              value={periodLengthInDays}
              onChange={e => updatePeriod(Number(e.target.value))}
              className="form-control"
            />
          </div>

          <div className="form-group" style={{ width: "170px" }}>
            <label className="form-label">Start Day</label>
            <input
              type="date"
              value={periodStartDay.format("YYYY-MM-DD")}
              onChange={e => setPeriodStartDay(moment(e.target.value))}
              className="form-control"
            />
          </div>
          <Button
            id="previous-period"
            variant="outline-secondary"
            onClick={() => shiftPeriod(-periodLengthInDays)}
          >
            <Icon icon={IconNames.FAST_BACKWARD} />-{periodLengthInDays} days
          </Button>
          <Button
            id="previous-week"
            variant="outline-secondary"
            onClick={() => shiftPeriod(-7)}
          >
            <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />
            -1 week
          </Button>
          <Button
            id="previous-day"
            variant="outline-secondary"
            onClick={() => shiftPeriod(-1)}
          >
            <Icon icon={IconNames.CHEVRON_LEFT} />
            -1 day
          </Button>
          <Button
            id="next-day"
            variant="outline-secondary"
            onClick={() => shiftPeriod(1)}
          >
            <Icon icon={IconNames.CHEVRON_RIGHT} />
            +1 day
          </Button>
          <Button
            id="next-week"
            variant="outline-secondary"
            onClick={() => shiftPeriod(7)}
          >
            <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
            +1 week
          </Button>
          <Button
            id="next-period"
            variant="outline-secondary"
            onClick={() => shiftPeriod(periodLengthInDays)}
          >
            <Icon icon={IconNames.FAST_FORWARD} />+{periodLengthInDays} days
          </Button>

          {emptyMsgComponent}
        </div>
      </div>
      <div style={{ clear: "both", marginTop: "1rem" }}>
        <div
          ref={scrollContainerRef}
          style={{ overflowX: "auto", whiteSpace: "nowrap", width: "100%" }}
        >
          <Table
            className="event-matrix"
            responsive
            hover
            id="events-matrix"
            style={{ minWidth: `${periodDays.length * 250}px` }}
          >
            <tbody>
              <tr id="event-series-table-header" className="table-primary">
                <th>Event Series</th>
                {periodDays.map(periodDay => (
                  <th key={periodDay} style={{ minWidth: "120px" }}>
                    {periodDay.format("YYYY-MM-DD")}
                    <br />
                    {periodDay.format("dddd")}
                  </th>
                ))}
              </tr>
              {_isEmpty(includedEventSeries) ? (
                <tr className="event-series-row">
                  <td colSpan={periodDays.length + 1}>
                    No matching Event Series
                  </td>
                </tr>
              ) : (
                includedEventSeries.map(es => {
                  const eventSeriesEvents = events.filter(
                    e => e.eventSeries?.uuid === es.uuid
                  )
                  return (
                    <tr key={es.uuid} className="event-series-row">
                      <td
                        style={{
                          minWidth: "200px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          verticalAlign: "top"
                        }}
                      >
                        <LinkTo modelType="EventSeries" model={es} />
                      </td>
                      {periodDays.map((_, idx) => (
                        <td key={idx}>{getEvent(eventSeriesEvents, idx)}</td>
                      ))}
                    </tr>
                  )
                })
              )}
              <tr id="tasks-table-header" className="table-primary">
                <th>{Settings.fields.task.shortLabel}</th>
                {periodDays.map(periodDay => (
                  <th key={periodDay} style={{ minWidth: "120px" }}>
                    {periodDay.format("YYYY-MM-DD")}
                    <br />
                    {periodDay.format("dddd")}
                  </th>
                ))}
              </tr>
              {_isEmpty(includedTasks) ? (
                <tr className="event-series-task-row">
                  <td colSpan={periodDays.length + 1}>
                    No matching {Settings.fields.task.shortLabel}
                  </td>
                </tr>
              ) : (
                includedTasks.map(task => {
                  const taskEvents = events.filter(e => hasTask(e.tasks, task))
                  const hideParents = includeTask
                    ? task.uuid !== taskUuid
                    : !!task.parentTask?.uuid
                  const ascendantTasks = task.ascendantTasks || [task]
                  const ascendantTaskUuids = new Set(
                    hideParents ? ascendantTasks.map(t => t.uuid) : [taskUuid]
                  )

                  return (
                    <tr key={task.uuid} className="event-series-task-row">
                      <td
                        style={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          paddingLeft: `${task.level * 20}px`,
                          verticalAlign: "top"
                        }}
                      >
                        <BreadcrumbTrail
                          modelType="Task"
                          leaf={task}
                          ascendantObjects={ascendantTasks}
                          parentField="parentTask"
                          hideParents={hideParents}
                          ascendantTaskUuids={ascendantTaskUuids}
                        />
                      </td>
                      {periodDays.map((_, idx) => (
                        <td key={idx}>{getEvent(taskEvents, idx, task)}</td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventMatrix)
