import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet from "components/Leaflet"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import { Location } from "models"
import React, { useContext } from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import GeoLocation, { GEO_LOCATION_DISPLAY_TYPE } from "./GeoLocation"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
      lat
      lng
      status
      planningApprovalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            role
            avatar(size: 32)
          }
        }
      }
      approvalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            role
            avatar(size: 32)
          }
        }
      }
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const LocationShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  const { uuid } = useParams()
  const routerLocation = useLocation()
  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION, {
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
  if (done) {
    return result
  }

  const location = new Location(data ? data.location : {})
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error
  const canEdit = currentUser.isSuperUser()

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
        const action = canEdit && (
          <LinkTo
            modelType="Location"
            model={location}
            edit
            button="primary"
            id="editButton"
          >
            Edit
          </LinkTo>
        )
        return (
          <div>
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
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={`Location ${location.name}`} action={action} />
              <Fieldset>
                <Field name="name" component={FieldHelper.ReadonlyField} />

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Location.humanNameOfStatus}
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
              </Fieldset>

              <Leaflet markers={[marker]} />
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
