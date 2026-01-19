import {
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Event, Location } from "models"
import { PositionRole } from "models/Position"
import moment from "moment"
import React, { useEffect, useRef, useState } from "react"
import { Badge, Col, Container, Row } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const ROLES = Object.keys(PositionRole)
const RANKS = Settings.fields.person.ranks.map(rank => rank.value)
const PEOPLE_ATTENDING_LIMIT = 5

const GQL_GET_EVENT_LIST = gql`
  query ($eventQuery: EventSearchQueryInput) {
    eventList(query: $eventQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Event}
        startDate
        endDate
        type
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        hostOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        eventSeries {
          ${gqlEntityFieldsMap.EventSeries}
        }
        location {
          ${gqlEntityFieldsMap.Location}
          lat
          lng
          type
        }
        tasks {
          ${gqlEntityFieldsMap.Task}
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
        organizations {
          ${gqlEntityFieldsMap.Organization}
        }
        people {
          ${gqlEntityFieldsMap.Person}
          position {
            role
          }
        }
      }
    }
  }
`

interface EventSummaryProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  showEventSeries?: boolean
}

const EventSummary = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination,
  showEventSeries
}: EventSummaryProps) => {
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    (queryParamsUnchanged && pagination?.[paginationKey]?.pageNum) ?? 0
  )

  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      if (paginationKey) {
        setPagination?.(paginationKey, 0)
      }
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])

  const eventQuery = {
    ...queryParams,
    pageNum,
    sortOrder: "DESC",
    sortBy: "START_DATE"
  }

  const { loading, error, data } = API.useApiQuery(GQL_GET_EVENT_LIST, {
    eventQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const totalCount = done ? null : data?.eventList?.totalCount
  useEffect(() => {
    setTotalCount?.(totalCount)
  }, [setTotalCount, totalCount])

  if (done) {
    return result
  }

  const { pageSize, pageNum: curPage, list: events } = data.eventList
  if (_get(events, "length", 0) === 0) {
    return <em>No events found</em>
  }

  function setPage(newPageNum: number) {
    if (paginationKey) {
      setPagination?.(paginationKey, 0)
    }
    setPageNum(newPageNum)
  }

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageSize={setPagination && pageSize}
        pageNum={setPagination && curPage}
        totalCount={setPagination && totalCount}
        goToPage={setPagination && setPage}
      >
        {events.map(event => (
          <EventSummaryRow
            event={event}
            key={event.uuid}
            showEventSeries={showEventSeries}
          />
        ))}
      </UltimatePaginationTopDown>
    </div>
  )
}

interface EventSummaryRowProps {
  event: any
  showEventSeries?: boolean
}

const EventSummaryRow = ({ event, showEventSeries }: EventSummaryRowProps) => {
  event = new Event(event)

  const sortedAttendees = (event.people || [])
    .slice()
    .sort(
      (a, b) =>
        // highest position role first
        ROLES.indexOf(b.position?.role) - ROLES.indexOf(a.position?.role) ||
        // when these are equal, highest rank first
        RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank) ||
        // when these are also equal, sort alphabetically on name
        a.name?.localeCompare(b.name) ||
        // last resort: sort by uuid
        a.uuid.localeCompare(b.uuid)
    )
    .slice(0, PEOPLE_ATTENDING_LIMIT)

  const separator = (
    <span className="border-start border-2 d-inline-block align-middle ms-2 me-1 pt-2 pb-3" />
  )
  return (
    <Container fluid className="event-summary">
      <Row className="my-1">
        <Col md={12}>
          <span>
            <strong>{Settings.fields.event.name.label}: </strong>
            {event.name}
          </span>
        </Col>
      </Row>
      <Row className="my-1">
        <Col md={12}>
          <span>
            <strong>{Settings.fields.event.type.label}: </strong>
            {Event.humanNameOfType(event.type)}
          </span>
        </Col>
      </Row>
      <Row className="my-1">
        <Col md={12}>
          <strong>{Settings.fields.event.startDate.label}: </strong>
          <Badge bg="secondary" className="engagement-date">
            {moment(event.startDate).format(Event.getEventDateFormat())}
          </Badge>
        </Col>
      </Row>
      <Row className="my-1">
        <Col md={12}>
          <strong>{Settings.fields.event.endDate.label}: </strong>
          <Badge bg="secondary" className="engagement-date">
            {moment(event.endDate).format(Event.getEventDateFormat())}
          </Badge>
        </Col>
      </Row>
      {!_isEmpty(event.ownerOrg) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.ownerOrg.label}: </strong>
              <LinkTo modelType="Organization" model={event.ownerOrg} />
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.hostOrg) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.hostOrg.label}: </strong>
              <LinkTo modelType="Organization" model={event.hostOrg} />
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.adminOrg) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.adminOrg.label}: </strong>
              <LinkTo modelType="Organization" model={event.adminOrg} />
            </span>
          </Col>
        </Row>
      )}
      {showEventSeries && !_isEmpty(event.eventSeries) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.eventSeries.label}: </strong>
              <LinkTo modelType="EventSeries" model={event.eventSeries} />
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.location) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.location.label}: </strong>
              <LinkTo modelType="Location" model={event.location}>
                {`${Location.toString(event.location)} `}
                <Badge bg="secondary">
                  {Location.humanNameOfType(event.location.type)}
                </Badge>
              </LinkTo>
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.tasks) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.tasks.label}:</strong>{" "}
              {event.tasks.map((task, i) => (
                <React.Fragment key={task.uuid}>
                  {i > 0 && separator}
                  <BreadcrumbTrail
                    modelType="Task"
                    leaf={task}
                    ascendantObjects={task.ascendantTasks}
                    parentField="parentTask"
                  />
                </React.Fragment>
              ))}
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.organizations) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.organizations.label}:</strong>{" "}
              {event.organizations.map((organization, i) => (
                <React.Fragment key={organization.uuid}>
                  {i > 0 && separator}
                  <LinkTo
                    modelType="Organization"
                    model={organization}
                    showIcon={false}
                  />
                </React.Fragment>
              ))}
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.people) && (
        <Row className="my-1">
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.people.label}:</strong>{" "}
              {sortedAttendees.map((person, i) => (
                <React.Fragment key={person.uuid}>
                  {i > 0 && separator}
                  <LinkTo modelType="Person" model={person} showIcon={false} />
                </React.Fragment>
              ))}
              {event.people.length > PEOPLE_ATTENDING_LIMIT && (
                <>
                  {separator}
                  <em>and more…</em>
                </>
              )}
            </span>
          </Col>
        </Row>
      )}
      <Row className="d-print-none">
        <Col className="read-report-actions" md={12}>
          <LinkTo
            modelType="Event"
            model={event}
            button
            className="read-report-button"
          >
            View Event
          </LinkTo>
        </Col>
      </Row>
    </Container>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventSummary)
