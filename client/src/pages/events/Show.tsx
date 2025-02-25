import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
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
import { Field, Form, Formik } from "formik"
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
  const reportQueryParams = {
    state: [Report.STATE.APPROVED, Report.STATE.PUBLISHED],
    eventUuid: uuid
  }

  const tasksLabel = pluralize(Settings.fields.task.shortLabel)

  return (
    <Formik enableReinitialize initialValues={event}>
      {({ values }) => {
        const action = (
          <>
            {canAdministrateOrg && (
              <LinkTo modelType="Event" model={event} edit button="primary">
                Edit
              </LinkTo>
            )}
          </>
        )
        return (
          <div>
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
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
                  <Col sm={12} md={12} lg={4} xl={3} className="text-center">
                    <EntityAvatarDisplay
                      avatar={event.entityAvatar}
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
                                wrappedComponent={Field}
                                dictProps={Settings.fields.event.name}
                                name="name"
                                component={FieldHelper.ReadonlyField}
                              />
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </FormGroup>
                  </Col>
                </Row>
              </Fieldset>
              <Fieldset id="info" title="Info">
                {event.eventSeries?.uuid && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.event.eventSeries}
                    name="eventSeries"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      event.eventSeries && (
                        <LinkTo
                          modelType="EventSeries"
                          model={event.eventSeries}
                        />
                      )
                    }
                  />
                )}
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.ownerOrg}
                  name="ownerOrg"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    event.ownerOrg && (
                      <LinkTo modelType="Organization" model={event.ownerOrg} />
                    )
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.hostOrg}
                  name="hostOrg"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    event.hostOrg && (
                      <LinkTo modelType="Organization" model={event.hostOrg} />
                    )
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.adminOrg}
                  name="adminOrg"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    event.adminOrg && (
                      <LinkTo modelType="Organization" model={event.adminOrg} />
                    )
                  }
                />
                {event.location?.uuid && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.event.location}
                    name="location"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      event.location && (
                        <LinkTo modelType="Location" model={event.location} />
                      )
                    }
                  />
                )}
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.type}
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Event.humanNameOfType(event.type)}
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.startDate}
                  name="startDate"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <>
                      {event.startDate &&
                        moment(event.startDate).format(
                          Event.getEventDateFormat()
                        )}
                    </>
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.endDate}
                  name="endDate"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <>
                      {event.endDate &&
                        moment(event.endDate).format(
                          Event.getEventDateFormat()
                        )}
                    </>
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.status}
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Event.humanNameOfStatus}
                />
                {attachmentsEnabled && (
                  <Field
                    name="attachments"
                    label="Attachments"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <AttachmentsDetailView
                        attachments={attachments}
                        updateAttachments={setAttachments}
                        relatedObjectType={Event.relatedObjectType}
                        relatedObjectUuid={values.uuid}
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
                <Fieldset
                  id="eventOrganizations"
                  title="Organizations attending"
                >
                  <NoPaginationOrganizationTable
                    id="events-organizations"
                    organizations={values.organizations}
                    noOrganizationsMessage="No Organizations currently assigned to this event. Click in the Organizations attending box to select organizations."
                  />
                </Fieldset>
              )}
              {event.people.length > 0 && (
                <Fieldset id="eventPeople" title="People attending">
                  <NoPaginationPersonTable
                    id="events-people"
                    people={values.people}
                    noPeopleMessage="No People currently assigned to this event. Click in the People attending box to select organizations."
                  />
                </Fieldset>
              )}
              {event.tasks.length > 0 && (
                <Fieldset
                  id="eventTasks"
                  title={Settings.fields.task.longLabel}
                >
                  <NoPaginationTaskTable
                    id="events-tasks"
                    tasks={values.tasks}
                    showDescription
                    noTasksMessage={`No ${tasksLabel} selected; click in the ${tasksLabel} box to view your organization's ${tasksLabel}`}
                  />
                </Fieldset>
              )}
              {event.outcomes && (
                <Fieldset
                  title={Settings.fields.event.outcomes?.label}
                  id="outcomes"
                >
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
                />
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(EventShow)
