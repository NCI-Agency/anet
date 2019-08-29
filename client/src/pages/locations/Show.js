import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet from "components/Leaflet"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollectionContainer from "components/ReportCollectionContainer"
import { Field, Form, Formik } from "formik"
import _escape from "lodash/escape"
import { Location, Person } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import {
  FORMAT_MAP,
  FORMAT_SUMMARY,
  FORMAT_TABLE,
  FORMAT_CALENDAR
} from "components/ReportCollection"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
      lat
      lng
      status
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

export const Coordinate = ({ coord }) => {
  const parsedCoord =
    typeof coord === "number" ? Math.round(coord * 1000) / 1000 : "?"
  return <span>{parsedCoord}</span>
}

Coordinate.propTypes = {
  coord: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

const BaseLocationShow = props => {
  const uuid = props.match.params.uuid
  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Location",
    uuid,
    ...props
  })
  if (done) {
    return result
  }

  const location = new Location(data ? data.location : {})
  const stateSuccess = props.location.state && props.location.state.success
  const stateError = props.location.state && props.location.state.error
  const { currentUser, ...myFormProps } = props
  const canEdit = currentUser.isSuperUser()

  return (
    <Formik enableReinitialize initialValues={location} {...myFormProps}>
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
          <LinkTo anetLocation={location} edit button="primary">
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
                <Field
                  name="name"
                  component={FieldHelper.renderReadonlyField}
                />

                <Field
                  name="status"
                  component={FieldHelper.renderReadonlyField}
                  humanValue={Location.humanNameOfStatus}
                />

                <Field
                  name="location"
                  component={FieldHelper.renderReadonlyField}
                  humanValue={
                    <React.Fragment>
                      <Coordinate coord={location.lat} />,{" "}
                      <Coordinate coord={location.lng} />
                    </React.Fragment>
                  }
                />
              </Fieldset>

              <Leaflet markers={[marker]} />
            </Form>

            <Fieldset title={"Reports at this Location"}>
              <ReportCollectionContainer
                queryParams={{ locationUuid: uuid }}
                paginationKey={`r_${uuid}`}
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
  ...pagePropTypes,
  currentUser: PropTypes.instanceOf(Person)
}

const LocationShow = props => (
  <AppContext.Consumer>
    {context => (
      <BaseLocationShow currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(LocationShow)
