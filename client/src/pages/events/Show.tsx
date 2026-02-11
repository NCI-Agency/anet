import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import EventHostMembersTable from "components/EventHostMembersTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import NoPaginationOrganizationTable from "components/NoPaginationOrganizationTable"
import NoPaginationPersonTable from "components/NoPaginationPersonTable"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import { Event, Report, Task } from "models"
import moment from "moment/moment"
import pluralize from "pluralize"
import React, { useContext, useEffect, useState } from "react"
import { Col, FormGroup, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"

interface EventShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const EventShow = ({ pageDispatchers }: EventShowProps) => {
  const { currentUser } = useContext(AppContext)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state?.success
  const [stateError, setStateError] = useState(routerLocation.state?.error)
  const [attachments, setAttachments] = useState([])
  const { uuid } = useParams()
  const { loading, error, data, refetch } = API.useApiQuery(
    Event.getEventQuery,
    {
      uuid
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Event",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.event?.name)
  useEffect(() => {
    setAttachments(data?.event?.attachments || [])
  }, [data])
  if (done) {
    return result
  }

  let event
  if (!data) {
    event = new Event()
  } else {
    data.event.tasks = Task.fromArray(data.event.tasks)
    event = new Event(data.event)
  }

  const canAdministrateOrg =
    currentUser?.isAdmin() ||
    currentUser?.hasAdministrativePermissionsForOrganization(event.adminOrg)
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const avatar =
    attachments?.some(a => a.uuid === event?.entityAvatar?.attachmentUuid) &&
    event.entityAvatar
  const reportQueryParams = {
    state: [Report.STATE.APPROVED, Report.STATE.PUBLISHED],
    eventUuid: uuid
  }

  const tasksLabel = pluralize(Settings.fields.task.shortLabel)

  const searchText = event.name
  const action = (
    <>
      {canAdministrateOrg && (
        <LinkTo modelType="Event" model={event} edit button="primary">
          Edit
        </LinkTo>
      )}
      <FindObjectsButton objectLabel="Event" searchText={searchText} />
    </>
  )

  return (
    <div>
      <Messages success={stateSuccess} error={stateError} />
      <div className="form-horizontal">
        <Fieldset
          title={
            <>
              {
                <SubscriptionIcon
                  subscribedObjectType="events"
                  subscribedObjectUuid={event.uuid}
                  isSubscribed={event.isSubscribed}
                  updatedAt={event.updatedAt}
                  refetch={refetch}
                  setError={error => {
                    setStateError(error)
                    jumpToTop()
                  }}
                  persistent
                />
              }{" "}
              Event {event.name}
            </>
          }
          action={action}
        />
        <Fieldset>
          <Row>
            <Col lg={4} xl={3} className="text-center">
              <EntityAvatarDisplay
                avatar={avatar}
                defaultAvatar={Event.relatedObjectType}
              />
            </Col>
            <Col
              lg={8}
              xl={9}
              className="d-flex flex-column justify-content-center"
            >
              <FormGroup>
                <Row style={{ marginBottom: "1rem" }}>
                  <Col sm={7}>
                    <Row>
                      <Col>
                        <DictionaryField
                          wrappedComponent={FieldHelper.ReadonlyField}
                          dictProps={Settings.fields.event.name}
                          field={{ name: "name", value: event.name }}
                        />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </FormGroup>
            </Col>
          </Row>
        </Fieldset>
        <Fieldset title={Settings.fields.event.eventHostRelatedObjects?.label}>
          <EventHostMembersTable event={event} />
        </Fieldset>
        <Fieldset id="info" title="Info">
          {event.eventSeries?.uuid && (
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.event.eventSeries}
              field={{ name: "eventSeries" }}
              humanValue={
                event.eventSeries && (
                  <LinkTo modelType="EventSeries" model={event.eventSeries} />
                )
              }
            />
          )}
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.event.ownerOrg}
            field={{ name: "ownerOrg" }}
            humanValue={
              event.ownerOrg && (
                <LinkTo modelType="Organization" model={event.ownerOrg} />
              )
            }
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.event.hostOrg}
            field={{ name: "hostOrg" }}
            humanValue={
              event.hostOrg && (
                <LinkTo modelType="Organization" model={event.hostOrg} />
              )
            }
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.event.adminOrg}
            field={{ name: "adminOrg" }}
            humanValue={
              event.adminOrg && (
                <LinkTo modelType="Organization" model={event.adminOrg} />
              )
            }
          />
          {event.location?.uuid && (
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.event.location}
              field={{ name: "location" }}
              humanValue={
                event.location && (
                  <LinkTo modelType="Location" model={event.location} />
                )
              }
            />
          )}
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.event.type}
            field={{ name: "eventType" }}
            humanValue={event.eventType?.name}
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.event.startDate}
            field={{ name: "startDate" }}
            humanValue={
              <>
                {event.startDate &&
                  moment(event.startDate).format(Event.getEventDateFormat())}
              </>
            }
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.event.endDate}
            field={{ name: "endDate" }}
            humanValue={
              <>
                {event.endDate &&
                  moment(event.endDate).format(Event.getEventDateFormat())}
              </>
            }
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.event.status}
            field={{ name: "status" }}
            humanValue={Event.humanNameOfStatus(event.status)}
          />
          {attachmentsEnabled && (
            <FieldHelper.ReadonlyField
              field={{ name: "attachments" }}
              label="Attachments"
              humanValue={
                <AttachmentsDetailView
                  attachments={attachments}
                  updateAttachments={setAttachments}
                  relatedObjectType={Event.relatedObjectType}
                  relatedObjectUuid={event.uuid}
                  allowEdit={canAdministrateOrg}
                />
              }
            />
          )}
        </Fieldset>
        <Fieldset
          title={Settings.fields.event.description?.label}
          id="description"
        >
          <RichTextEditor readOnly value={event.description} />
        </Fieldset>
        {event.organizations.length > 0 && (
          <Fieldset id="eventOrganizations" title="Organizations attending">
            <NoPaginationOrganizationTable
              id="events-organizations"
              organizations={event.organizations}
              noOrganizationsMessage="No Organizations currently assigned to this event. Click in the Organizations attending box to select organizations."
            />
          </Fieldset>
        )}
        {event.people.length > 0 && (
          <Fieldset id="eventPeople" title="People attending">
            <NoPaginationPersonTable
              id="events-people"
              people={event.people}
              noPeopleMessage="No People currently assigned to this event. Click in the People attending box to select organizations."
            />
          </Fieldset>
        )}
        {event.tasks.length > 0 && (
          <Fieldset id="eventTasks" title={Settings.fields.task.longLabel}>
            <NoPaginationTaskTable
              id="events-tasks"
              tasks={event.tasks}
              showDescription
              noTasksMessage={`No ${tasksLabel} selected; click in the ${tasksLabel} box to view your organization's ${tasksLabel}`}
            />
          </Fieldset>
        )}
        {event.outcomes && (
          <Fieldset title={Settings.fields.event.outcomes?.label} id="outcomes">
            <RichTextEditor readOnly value={event.outcomes} />
          </Fieldset>
        )}
        <Fieldset
          id="eventReports"
          title={`Reports for ${event.name}`}
          action={
            <LinkTo
              modelType="Event"
              model={Report.pathForNew({
                eventUuid: event.uuid
              })}
              button
            >
              Create report
            </LinkTo>
          }
        >
          <ReportCollection
            paginationKey={`r_${uuid}`}
            queryParams={reportQueryParams}
            mapId="reports"
            event={event}
          />
        </Fieldset>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  pagination: state.pagination
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(EventShow)
