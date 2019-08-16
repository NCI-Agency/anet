import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet from "components/Leaflet"
import LinkTo from "components/LinkTo"
import Messages, { setMessages } from "components/Messages"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollectionContainer from "components/ReportCollectionContainer"
import { Field, Form, Formik } from "formik"
import GQL from "graphqlapi"
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

const Coordinate = ({ coord }) => {
  const parsedCoord =
    typeof coord === "number" ? Math.round(coord * 1000) / 1000 : "?"
  return <span>{parsedCoord}</span>
}
Coordinate.propTypes = {
  coord: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

class BaseLocationShow extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  static modelName = "Location"

  state = {
    location: new Location(),
    success: null,
    error: null
  }

  constructor(props) {
    super(props)
    setMessages(props, this.state)
  }

  fetchData(props) {
    const locationQueryPart = new GQL.Part(/* GraphQL */ `
      location(uuid: $uuid) {
        uuid
        name
        lat
        lng
        status
        ${GRAPHQL_NOTES_FIELDS}
      }
    `).addVariable("uuid", "String!", props.match.params.uuid)

    return GQL.run([locationQueryPart]).then(data => {
      this.setState({
        location: new Location(data.location)
      })
    })
  }

  render() {
    const { location } = this.state
    const { currentUser, ...myFormProps } = this.props

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
              <Messages success={this.state.success} error={this.state.error} />
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
                  queryParams={{ locationUuid: this.props.match.params.uuid }}
                  paginationKey={`r_${this.props.match.params.uuid}`}
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
