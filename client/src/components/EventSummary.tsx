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
import { Event, Location } from "models"
import moment from "moment"
import React, { useState } from "react"
import { Badge, Col, Container, Row } from "react-bootstrap"
import { connect } from "react-redux"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"

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
        }
      }
    }
  }
`

interface EventSummaryProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  showEventSeries?: boolean
}

const EventSummary = ({
  pageDispatchers,
  queryParams,
  showEventSeries
}: EventSummaryProps) => {
  const [pageNum, setPageNum] = useState(0)
  const eventQuery = {
    ...queryParams,
    pageNum
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_EVENT_LIST, {
    eventQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const { totalCount = 0, list: events = [] } = data.eventList
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
        goToPage={setPageNum}
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

  return (
    <Container fluid className="event-summary">
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
      {!_isEmpty(event.ownerOrg) && (
        <Row>
          <Col md={12}>
            <span>
              <strong>{Settings.fields.event.ownerOrg.label}: </strong>
              <LinkTo modelType="Organization" model={event.ownerOrg} />
            </span>
          </Col>
        </Row>
      )}
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
      {showEventSeries && !_isEmpty(event.eventSeries) && (
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
              <LinkTo modelType="Location" model={event.location} />{" "}
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
              <strong>{Settings.fields.event.tasks.label}:</strong>{" "}
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
              <strong>{Settings.fields.event.organizations.label}:</strong>{" "}
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
              <strong>{Settings.fields.event.people.label}:</strong>{" "}
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

export default connect(null, mapPageDispatchersToProps)(EventSummary)
