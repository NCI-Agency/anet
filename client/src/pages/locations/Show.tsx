import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import { ReadonlyCustomFields } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EventCollection from "components/EventCollection"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import GeoLocation, { GEO_LOCATION_DISPLAY_TYPE } from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import LinkTo from "components/LinkTo"
import LocationTable from "components/LocationTable"
import Messages from "components/Messages"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import OrganizationTable from "components/OrganizationTable"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PositionTable from "components/PositionTable"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import { Attachment, Location } from "models"
import React, { useContext, useEffect, useState } from "react"
import { connect } from "react-redux"
import { Link, useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      ${Location.allFieldsQuery}
      attachments {
        ${Attachment.basicFieldsQuery}
      }
    }
  }
`

interface LocationShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const LocationShow = ({ pageDispatchers }: LocationShowProps) => {
  const { currentUser } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state?.success
  const [stateError, setStateError] = useState(routerLocation.state?.error)
  const [attachments, setAttachments] = useState([])
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_LOCATION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Location",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.location?.name)
  useEffect(() => {
    setAttachments(data?.location?.attachments || [])
  }, [data])
  if (done) {
    return result
  }
  if (data) {
    data.location[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.location.customFields
    )
  }
  const location = new Location(data ? data.location : {})
  const isAdmin = currentUser?.isAdmin()
  const canEdit = currentUser?.isSuperuser()
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled

  return (
    <Formik enableReinitialize initialValues={location}>
      {({ values }) => {
        const marker = {
          id: location.uuid || 0,
          name: _escape(location.name) || "" // escape HTML in location name!
        }
        if (Location.hasCoordinates(location)) {
          Object.assign(marker, {
            lat: location.lat,
            lng: location.lng
          })
        }
        const searchText = [
          location.name,
          location.digram,
          location.trigram
        ].join(" ")
        const action = (
          <>
            {isAdmin && (
              <Link
                id="mergeWithOther"
                to="/admin/merge/locations"
                state={{ initialLeftUuid: location.uuid }}
                className="btn btn-outline-secondary"
              >
                Merge with other location
              </Link>
            )}
            {canEdit && (
              <LinkTo
                modelType="Location"
                model={location}
                edit
                button="primary"
                id="editButton"
              >
                Edit
              </LinkTo>
            )}
            <FindObjectsButton objectLabel="Location" searchText={searchText} />
            <RelatedObjectNotes
              notes={location.notes}
              relatedObject={
                location.uuid && {
                  relatedObjectType: Location.relatedObjectType,
                  relatedObjectUuid: location.uuid,
                  relatedObject: location
                }
              }
            />
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
                        subscribedObjectType="locations"
                        subscribedObjectUuid={location.uuid}
                        isSubscribed={location.isSubscribed}
                        updatedAt={location.updatedAt}
                        refetch={refetch}
                        setError={error => {
                          setStateError(error)
                          jumpToTop()
                        }}
                        persistent
                      />
                    }{" "}
                    Location {location.name}
                  </>
                }
                action={action}
              />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.location.name}
                  name="name"
                  component={FieldHelper.ReadonlyField}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.location.type}
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Location.humanNameOfType(location.type)}
                />

                {Location.hasCoordinates(location) && (
                  <GeoLocation
                    coordinates={{
                      lat: location.lat,
                      lng: location.lng,
                      displayedCoordinate: convertLatLngToMGRS(
                        location.lat,
                        location.lng
                      )
                    }}
                    displayType={GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD}
                  />
                )}

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.location.status}
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Location.humanNameOfStatus}
                />

                {location.type === Location.LOCATION_TYPES.COUNTRY && (
                  <>
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.location.digram}
                      name="digram"
                      component={FieldHelper.ReadonlyField}
                    />

                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.location.trigram}
                      name="trigram"
                      component={FieldHelper.ReadonlyField}
                    />
                  </>
                )}

                {!_isEmpty(location.parentLocations) && (
                  <Field
                    name="parentLocations"
                    label="Parent locations"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <LocationTable
                        id="location-parentLocations"
                        locations={values.parentLocations}
                      />
                    }
                  />
                )}

                {!_isEmpty(location.childrenLocations) && (
                  <Field
                    name="childrenLocations"
                    label="Child locations"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <LocationTable
                        id="location-childrenLocations"
                        locations={values.childrenLocations}
                      />
                    }
                  />
                )}

                {location.description && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.location.description}
                    name="description"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <RichTextEditor readOnly value={location.description} />
                    }
                  />
                )}

                {attachmentsEnabled && (
                  <Field
                    name="attachments"
                    label="Attachments"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <AttachmentsDetailView
                        attachments={attachments}
                        updateAttachments={setAttachments}
                        relatedObjectType={Location.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                        allowEdit={canEdit}
                      />
                    }
                  />
                )}
              </Fieldset>

              {Settings.fields.location.customFields && (
                <Fieldset title="Location information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.location.customFields}
                    values={values}
                  />
                </Fieldset>
              )}

              {Location.hasCoordinates(location) && (
                <Leaflet markers={[marker]} />
              )}
            </Form>

            <Approvals relatedObject={location} />

            <Fieldset title="Organizations at this Location">
              <OrganizationTable queryParams={{ locationUuid: uuid }} />
            </Fieldset>

            <Fieldset title="Positions at this Location">
              <PositionTable queryParams={{ locationUuid: uuid }} />
            </Fieldset>

            <Fieldset title="Reports at this Location">
              <ReportCollection
                paginationKey={`r_${uuid}`}
                queryParams={{ locationUuid: uuid }}
                mapId="reports"
              />
            </Fieldset>
            <Fieldset title="Events at this Location">
              <EventCollection
                paginationKey={`e_${uuid}`}
                queryParams={{ locationUuid: uuid }}
                mapId="events"
                showEventSeries
              />
            </Fieldset>
          </div>
        )
      }}
    </Formik>
  )
}

export default connect(null, mapPageDispatchersToProps)(LocationShow)
