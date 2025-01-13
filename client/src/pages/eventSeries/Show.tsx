import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
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
import { Field, Form, Formik } from "formik"
import { Event, EventSeries } from "models"
import React, { useContext, useState } from "react"
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
  if (done) {
    return result
  }

  const eventSeries = new EventSeries(data ? data.eventSeries : {})

  const canAdministrateOrg =
    currentUser?.isAdmin() ||
    currentUser?.hasAdministrativePermissionsForOrganization(
      eventSeries.adminOrg
    )
  const eventQueryParams = {
    eventSeriesUuid: uuid
  }

  return (
    <Formik enableReinitialize initialValues={eventSeries}>
      {({ values }) => {
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
            <Form className="form-horizontal" method="post">
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
              <Fieldset id="info" title="Info">
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.eventSeries.hostOrg}
                  name="hostOrg"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    eventSeries.hostOrg && (
                      <LinkTo
                        modelType="Organization"
                        model={eventSeries.hostOrg}
                      />
                    )
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.eventSeries.adminOrg}
                  name="adminOrg"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    eventSeries.adminOrg && (
                      <LinkTo
                        modelType="Organization"
                        model={eventSeries.adminOrg}
                      />
                    )
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.eventSeries.status}
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={EventSeries.humanNameOfStatus}
                />
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

export default connect(
  mapStateToProps,
  mapPageDispatchersToProps
)(EventSeriesShow)
