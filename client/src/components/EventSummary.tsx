import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import { PageDispatchersPropType, useBoilerplate } from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Event, Location } from "models"
import moment from "moment"
import pluralize from "pluralize"
import React, { useEffect, useRef, useState } from "react"
import { Badge, Col, Container, Row } from "react-bootstrap"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

const DEFAULT_PAGESIZE = 10

interface EventSummaryProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  paginationKey: string
  setPagination: (...args: unknown[]) => unknown
  pagination: any
}

const EventSummary = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  paginationKey,
  pagination,
  setPagination
}: EventSummaryProps) => {
  // (Re)set pageNum to 0 if the queryParams change, and make sure we retrieve page 0 in that case
  const latestQueryParams = useRef(queryParams)
  const queryParamsUnchanged = _isEqual(latestQueryParams.current, queryParams)
  const [pageNum, setPageNum] = useState(
    queryParamsUnchanged && pagination[paginationKey]
      ? pagination[paginationKey].pageNum
      : 0
  )
  useEffect(() => {
    if (!queryParamsUnchanged) {
      latestQueryParams.current = queryParams
      setPagination(paginationKey, 0)
      setPageNum(0)
    }
  }, [queryParams, setPagination, paginationKey, queryParamsUnchanged])
  const eventQuery = Object.assign({}, queryParams, {
    pageNum: queryParamsUnchanged ? pageNum : 0,
    pageSize: queryParams.pageSize || DEFAULT_PAGESIZE
  })
  const { loading, error, data } = API.useApiQuery(Event.getEventListQuery, {
    eventQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  // Update the total count
  const totalCount = done ? null : data?.eventList?.totalCount
  useEffect(
    () => setTotalCount && setTotalCount(totalCount),
    [setTotalCount, totalCount]
  )
  if (done) {
    return result
  }

  const events = data ? data.eventList.list : []
  if (_get(events, "length", 0) === 0) {
    return <em>No events found</em>
  }

  const { pageSize } = data.eventList

  return (
    <div>
      <UltimatePaginationTopDown
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={setPage}
      >
        {events.map(event => (
          <EventSummaryRow event={event} key={event.uuid} />
        ))}
      </UltimatePaginationTopDown>
    </div>
  )

  function setPage(pageNum) {
    setPagination(paginationKey, pageNum)
    setPageNum(pageNum)
  }
}

interface EventSummaryRowProps {
  event: any
}

const EventSummaryRow = ({ event }: EventSummaryRowProps) => {
  event = new Event(event)

  return (
    <Container fluid className="report-summary">
      <Row>
        <Col md={12}>
          <span>
            <strong>{Settings.fields.event.name.label}: </strong>
            {event.name}
          </span>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <span>
            <strong>{Settings.fields.event.type.label}: </strong>
            {Event.humanNameOfType(event.type)}
          </span>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <strong>{Settings.fields.event.startDate.label}: </strong>
          <Badge bg="secondary" className="engagement-date">
            {moment(event.startDate).format(Event.getEventDateFormat())}
          </Badge>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <strong>{Settings.fields.event.endDate.label}: </strong>
          <Badge bg="secondary" className="engagement-date">
            {moment(event.endDate).format(Event.getEventDateFormat())}
          </Badge>
        </Col>
      </Row>
      {!_isEmpty(event.hostOrg) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.hostOrg.label}: </strong>
              <LinkTo modelType="Organization" model={event.hostOrg} />
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.adminOrg) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.adminOrg.label}: </strong>
              <LinkTo modelType="Organization" model={event.adminOrg} />
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.eventSeries) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.eventSeries.label}: </strong>
              <LinkTo modelType="EventSeries" model={event.eventSeries} />
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.location) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.location.label}: </strong>
              <LinkTo modelType="Location" model={event.location} />
              {"  "}
              <Badge bg="secondary">
                {Location.humanNameOfType(event.location.type)}
              </Badge>
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.tasks) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{pluralize(Settings.fields.event.tasks)}:</strong>{" "}
              {event.tasks.map((task, i) => (
                <React.Fragment key={task.uuid}>
                  {i > 0 && (
                    <img src={TASKS_ICON} alt="★" className="ms-1 me-1" />
                  )}
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
        <Row>
          <Col md={12}>
            <span>
              <strong>{pluralize(Settings.fields.event.organizations)}:</strong>{" "}
              {event.organizations.map((organization, i) => (
                <React.Fragment key={organization.uuid}>
                  {i > 0 && (
                    <img
                      src={ORGANIZATIONS_ICON}
                      alt="★"
                      className="ms-1 me-1"
                    />
                  )}
                  <LinkTo modelType="Organization" model={organization} />
                </React.Fragment>
              ))}
            </span>
          </Col>
        </Row>
      )}
      {!_isEmpty(event.people) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{pluralize(Settings.fields.event.people)}:</strong>{" "}
              {event.people.map((person, i) => (
                <React.Fragment key={person.uuid}>
                  {i > 0 && (
                    <img src={PEOPLE_ICON} alt="★" className="ms-1 me-1" />
                  )}
                  <LinkTo modelType="Person" model={person} />
                </React.Fragment>
              ))}
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

export default EventSummary
