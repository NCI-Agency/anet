import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import DictionaryField from "components/DictionaryField"
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
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { Event, Report } from "models"
import moment from "moment/moment"
import React, { useContext, useState } from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"

const EventShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
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
  if (done) {
    return result
  }

  const event = new Event(data ? data.event : {})

  const canAdministrateOrg =
    currentUser &&
    currentUser.hasAdministrativePermissionsForOrganization(event.adminOrg)

  const reportQueryParams = {
    state: [Report.STATE.PUBLISHED],
    eventUuid: uuid
  }
  return (
    <Formik enableReinitialize initialValues={event}>
      {({ values }) => {
        const action = (
          <>
            {canAdministrateOrg && (
              <LinkTo
                modelType="Event"
                model={event}
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
                        subscribedObjectType="event"
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
              <Fieldset id="info" tile="Info">
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
                {event.eventSeries && event.eventSeries.uuid && (
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
                {event.location && event.location.uuid && (
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
              </Fieldset>
              <Fieldset
                title={Settings.fields.eventSeries.description?.label}
                id="report-text"
              >
                <RichTextEditor readOnly value={event.description} />
              </Fieldset>
              <Fieldset
                title={Settings.fields.event.outcomes?.label}
                id="report-text"
              >
                <RichTextEditor readOnly value={event.outcomes} />
              </Fieldset>
              <Fieldset
                id="reports"
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

EventShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(mapStateToProps, mapPageDispatchersToProps)(EventShow)
