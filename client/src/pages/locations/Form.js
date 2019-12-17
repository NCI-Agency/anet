import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet from "components/Leaflet"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import { Field, Form, Formik } from "formik"
import _escape from "lodash/escape"
import { Location, Person } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { Coordinate } from "./Show"

const GQL_CREATE_LOCATION = gql`
  mutation($location: LocationInput!) {
    createLocation(location: $location) {
      uuid
    }
  }
`
const GQL_UPDATE_LOCATION = gql`
  mutation($location: LocationInput!) {
    updateLocation(location: $location)
  }
`

const BaseLocationForm = props => {
  const { currentUser, edit, title, ...myFormProps } = props
  const history = useHistory()
  const [error, setError] = useState(null)
  const canEditName =
    (!edit && currentUser.isSuperUser()) || (edit && currentUser.isAdmin())
  const statusButtons = [
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

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
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
          autoPan: true,
          onMove: (event, map) => onMarkerMove(event, map, setFieldValue)
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
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <Field
                  name="name"
                  component={FieldHelper.renderInputField}
                  disabled={!canEditName}
                />

                <Field
                  name="status"
                  component={FieldHelper.renderButtonToggleGroup}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <Field
                  name="location"
                  component={FieldHelper.renderReadonlyField}
                  humanValue={
                    <>
                      <Coordinate coord={values.lat} />,{" "}
                      <Coordinate coord={values.lng} />
                    </>
                  }
                />
              </Fieldset>

              <h3>Drag the marker below to set the location</h3>
              <Leaflet markers={[marker]} />

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel}>Cancel</Button>
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

  function onMarkerMove(event, map, setFieldValue) {
    const latLng = map.wrapLatLng(event.latlng)
    setFieldValue("lat", latLng.lat)
    setFieldValue("lng", latLng.lng)
  }

  function onCancel() {
    history.goBack()
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const { edit } = props
    const operation = edit ? "updateLocation" : "createLocation"
    const location = new Location({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : props.initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    if (!edit) {
      history.replace(Location.pathForEdit(location))
    }
    history.push(Location.pathFor(location), {
      success: "Location saved"
    })
  }

  function save(values, form) {
    const location = Object.without(new Location(values), "notes")
    return API.mutation(
      props.edit ? GQL_UPDATE_LOCATION : GQL_CREATE_LOCATION,
      { location }
    )
  }
}

BaseLocationForm.propTypes = {
  initialValues: PropTypes.instanceOf(Location).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  currentUser: PropTypes.instanceOf(Person)
}

BaseLocationForm.defaultProps = {
  initialValues: new Location(),
  title: "",
  edit: false
}

const LocationForm = props => (
  <AppContext.Consumer>
    {context => (
      <BaseLocationForm currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default LocationForm
