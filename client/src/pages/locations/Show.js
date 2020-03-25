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
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection, {
  FORMAT_MAP,
  FORMAT_SUMMARY,
  FORMAT_TABLE,
  FORMAT_CALENDAR
} from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import _escape from "lodash/escape"
import { Location, Person } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"

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

export const Coordinate = ({ coord }) => {
  const parsedCoord =
    typeof coord === "number" ? Math.round(coord * 10000) / 10000 : "?"
  return <span>{parsedCoord}</span>
}

Coordinate.propTypes = {
  coord: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

const BaseLocationShow = ({ pageDispatchers, currentUser }) => {
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
                  relatedObjectType: "locations",
                  relatedObjectUuid: location.uuid
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

                <Field
                  name="location"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <>
                      <Coordinate coord={location.lat} />,{" "}
                      <Coordinate coord={location.lng} />
                    </>
                  }
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
                viewFormats={[
                  FORMAT_CALENDAR,
                  FORMAT_SUMMARY,
                  FORMAT_TABLE,
                  FORMAT_MAP
                ]}
              />
            </Fieldset>
          </div>
        )
      }}
    </Formik>
  )
}

BaseLocationShow.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  currentUser: PropTypes.instanceOf(Person)
}

const LocationShow = props => (
  <AppContext.Consumer>
    {context => (
      <BaseLocationShow currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default connect(null, mapPageDispatchersToProps)(LocationShow)
