import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import EventCollection from "components/EventCollection"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { Event, EventSeries } from "models"
import React, { useContext, useEffect, useState } from "react"
import { Col, FormGroup, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"

interface EventSeriesShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const EventSeriesShow = ({ pageDispatchers }: EventSeriesShowProps) => {
  const { currentUser } = useContext(AppContext)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state?.success
  const [stateError, setStateError] = useState(routerLocation.state?.error)
  const [attachments, setAttachments] = useState([])
  const { uuid } = useParams()
  const { loading, error, data, refetch } = API.useApiQuery(
    EventSeries.getEventSeriesQuery,
    {
      uuid
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "EventSeries",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.eventSeries?.name)
  useEffect(() => {
    setAttachments(data?.eventSeries?.attachments || [])
  }, [data])
  if (done) {
    return result
  }

  const eventSeries = new EventSeries(data ? data.eventSeries : {})

  const canAdministrateOrg =
    currentUser?.isAdmin() ||
    currentUser?.hasAdministrativePermissionsForOrganization(
      eventSeries.adminOrg
    )
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const avatar =
    attachments?.some(
      a => a.uuid === eventSeries?.entityAvatar?.attachmentUuid
    ) && eventSeries.entityAvatar
  const eventQueryParams = {
    eventSeriesUuid: uuid
  }

  const action = (
    <>
      {canAdministrateOrg && (
        <LinkTo
          modelType="EventSeries"
          model={eventSeries}
          edit
          button="primary"
          id="editButton"
        >
          Edit
        </LinkTo>
      )}
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
                  subscribedObjectType="eventSeries"
                  subscribedObjectUuid={eventSeries.uuid}
                  isSubscribed={eventSeries.isSubscribed}
                  updatedAt={eventSeries.updatedAt}
                  refetch={refetch}
                  setError={error => {
                    setStateError(error)
                    jumpToTop()
                  }}
                  persistent
                />
              }{" "}
              Event Series {eventSeries.name}
            </>
          }
          action={action}
        />
        <Fieldset>
          <Row>
            <Col lg={4} xl={3} className="text-center">
              <EntityAvatarDisplay
                avatar={avatar}
                defaultAvatar={EventSeries.relatedObjectType}
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
                          dictProps={Settings.fields.eventSeries.name}
                          field={{ name: "name", value: eventSeries.name }}
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
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.eventSeries.ownerOrg}
            field={{ name: "ownerOrg" }}
            humanValue={
              eventSeries.ownerOrg && (
                <LinkTo modelType="Organization" model={eventSeries.ownerOrg} />
              )
            }
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.eventSeries.hostOrg}
            field={{ name: "hostOrg" }}
            humanValue={
              eventSeries.hostOrg && (
                <LinkTo modelType="Organization" model={eventSeries.hostOrg} />
              )
            }
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.eventSeries.adminOrg}
            field={{ name: "adminOrg" }}
            humanValue={
              eventSeries.adminOrg && (
                <LinkTo modelType="Organization" model={eventSeries.adminOrg} />
              )
            }
          />
          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.eventSeries.status}
            field={{ name: "status" }}
            humanValue={EventSeries.humanNameOfStatus(eventSeries.status)}
          />
          {attachmentsEnabled && (
            <FieldHelper.ReadonlyField
              field={{ name: "attachments" }}
              label="Attachments"
              humanValue={
                <AttachmentsDetailView
                  attachments={attachments}
                  updateAttachments={setAttachments}
                  relatedObjectType={EventSeries.relatedObjectType}
                  relatedObjectUuid={eventSeries.uuid}
                  allowEdit={canAdministrateOrg}
                />
              }
            />
          )}
        </Fieldset>
        <Fieldset
          title={Settings.fields.eventSeries.description?.label}
          id="description"
        >
          <RichTextEditor readOnly value={eventSeries.description} />
        </Fieldset>
        <Fieldset
          id="events"
          title={`Events for ${eventSeries.name}`}
          action={
            canAdministrateOrg && (
              <LinkTo
                modelType="Event"
                model={Event.pathForNew({
                  eventSeriesUuid: eventSeries.uuid
                })}
                button
              >
                Create event
              </LinkTo>
            )
          }
        >
          <EventCollection
            paginationKey={`e_${uuid}`}
            queryParams={eventQueryParams}
            mapId="events"
          />
        </Fieldset>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapPageDispatchersToProps
)(EventSeriesShow)
