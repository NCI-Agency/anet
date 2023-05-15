import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import { ReadonlyCustomFields } from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GeoLocation, { GEO_LOCATION_DISPLAY_TYPE } from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import { Location } from "models"
import React, { useContext, useState } from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      ${Location.allFieldsQuery}
    }
  }
`

const LocationShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
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
  if (done) {
    return result
  }
  if (data) {
    data.location[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.location.customFields
    )
  }
  const location = new Location(data ? data.location : {})
  const canEdit = currentUser.isSuperuser()

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
        const action = (
          <>
            {canEdit && (
              <span style={{ marginLeft: "1rem" }}>
                <LinkTo
                  modelType="Location"
                  model={location}
                  edit
                  button="primary"
                  id="editButton"
                >
                  Edit
                </LinkTo>
              </span>
            )}
            <span className="ms-3">
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
            </span>
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
                <Field name="name" component={FieldHelper.ReadonlyField} />

                <Field
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Location.humanNameOfType(location.type)}
                />

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

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Location.humanNameOfStatus}
                />

                {values.description && (
                  <Field
                    name="description"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <RichTextEditor readOnly value={values.description} />
                    }
                  />
                )}
              </Fieldset>

              <Leaflet markers={[marker]} />
              {Settings.fields.location.customFields && (
                <Fieldset title="Location information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.location.customFields}
                    values={values}
                  />
                </Fieldset>
              )}
            </Form>

            <Approvals relatedObject={location} />

            <Fieldset title="Reports at this Location">
              <ReportCollection
                paginationKey={`r_${uuid}`}
                queryParams={{ locationUuid: uuid }}
                mapId="reports"
              />
            </Fieldset>
          </div>
        )
      }}
    </Formik>
  )
}

LocationShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(LocationShow)
