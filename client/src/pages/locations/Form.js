import API from "api"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet from "components/Leaflet"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import { Field, Form, Formik } from "formik"
import _escape from "lodash/escape"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button } from "react-bootstrap"
import { withRouter } from "react-router-dom"

class LocationForm extends Component {
  static propTypes = {
    initialValues: PropTypes.object.isRequired,
    title: PropTypes.string,
    edit: PropTypes.bool
  }

  static defaultProps = {
    initialValues: new Location(),
    title: "",
    edit: false
  }

  statusButtons = [
    {
      id: "statusActiveButton",
      value: Location.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Location.STATUS.INACTIVE,
      label: "Inactive"
    }
  ]
  state = {
    error: null
  }

  render() {
    const { edit, title, ...myFormProps } = this.props

    function Coordinate(props) {
      const coord =
        typeof props.coord === "number"
          ? Math.round(props.coord * 1000) / 1000
          : "?"
      return <span>{coord}</span>
    }

    return (
      <Formik
        enableReinitialize
        onSubmit={this.onSubmit}
        validationSchema={Location.yupSchema}
        isInitialValid
        {...myFormProps}
      >
        {({
          handleSubmit,
          isSubmitting,
          dirty,
          errors,
          setFieldValue,
          values,
          submitForm
        }) => {
          const marker = {
            id: values.uuid || 0,
            name: _escape(values.name) || "", // escape HTML in location name!
            draggable: true,
            onMove: event => this.onMarkerMove(event, setFieldValue)
          }
          if (Location.hasCoordinates(values)) {
            Object.assign(marker, {
              lat: values.lat,
              lng: values.lng
            })
          }
          const action = (
            <div>
              <Button
                key="submit"
                bsStyle="primary"
                type="button"
                onClick={submitForm}
                disabled={isSubmitting}
              >
                Save Location
              </Button>
            </div>
          )
          return (
            <div>
              <NavigationWarning isBlocking={dirty} />
              <Messages error={this.state.error} />
              <Form className="form-horizontal" method="post">
                <Fieldset title={title} action={action} />
                <Fieldset>
                  <Field name="name" component={FieldHelper.renderInputField} />

                  <Field
                    name="status"
                    component={FieldHelper.renderButtonToggleGroup}
                    buttons={this.statusButtons}
                    onChange={value => setFieldValue("status", value)}
                  />

                  <Field
                    name="location"
                    component={FieldHelper.renderReadonlyField}
                    humanValue={
                      <React.Fragment>
                        <Coordinate coord={values.lat} />,{" "}
                        <Coordinate coord={values.lng} />
                      </React.Fragment>
                    }
                  />
                </Fieldset>

                <h3>Drag the marker below to set the location</h3>
                <Leaflet markers={[marker]} />

                <div className="submit-buttons">
                  <div>
                    <Button onClick={this.onCancel}>Cancel</Button>
                  </div>
                  <div>
                    <Button
                      id="formBottomSubmit"
                      bsStyle="primary"
                      type="button"
                      onClick={submitForm}
                      disabled={isSubmitting}
                    >
                      Save Location
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          )
        }}
      </Formik>
    )
  }

  onMarkerMove = (event, setFieldValue) => {
    const latLng = event.latlng
    setFieldValue("lat", latLng.lat)
    setFieldValue("lng", latLng.lng)
  }

  onCancel = () => {
    this.props.history.goBack()
  }

  onSubmit = (values, form) => {
    return this.save(values, form)
      .then(response => this.onSubmitSuccess(response, values, form))
      .catch(error => {
        this.setState({ error }, () => {
          form.setSubmitting(false)
          jumpToTop()
        })
      })
  }

  onSubmitSuccess = (response, values, form) => {
    const { edit } = this.props
    const operation = edit ? "updateLocation" : "createLocation"
    const location = new Location({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : this.props.initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    this.props.history.replace(Location.pathForEdit(location))
    this.props.history.push({
      pathname: Location.pathFor(location),
      state: {
        success: "Location saved"
      }
    })
  }

  save = (values, form) => {
    const location = new Location(values)
    const { edit } = this.props
    const operation = edit ? "updateLocation" : "createLocation"
    let graphql = operation + "(location: $location)"
    graphql += edit ? "" : " { uuid }"
    const variables = { location: location }
    const variableDef = "($location: LocationInput!)"
    return API.mutation(graphql, variables, variableDef)
  }
}

export default withRouter(LocationForm)
