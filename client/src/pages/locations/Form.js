import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet from "components/Leaflet"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import { FastField, Field, Form, Formik } from "formik"
import _escape from "lodash/escape"
import { Location, Person, Position } from "models"
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

const BaseLocationForm = ({ currentUser, edit, title, initialValues }) => {
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

  const approversFilters = {
    allAdvisorPositions: {
      label: "All advisor positions",
      queryVars: {
        type: [
          Position.TYPE.ADVISOR,
          Position.TYPE.SUPER_USER,
          Position.TYPE.ADMINISTRATOR
        ],
        matchPersonName: true
      }
    }
  }
  if (currentUser.position) {
    approversFilters.myColleagues = {
      label: "My colleagues",
      queryVars: {
        matchPersonName: true,
        organizationUuid: currentUser.position.organization.uuid
      }
    }
  }

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Location.yupSchema}
      initialValues={initialValues}
    >
      {({
        handleSubmit,
        isSubmitting,
        dirty,
        errors,
        setFieldTouched,
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
                <FastField
                  name="name"
                  component={FieldHelper.InputField}
                  disabled={!canEditName}
                />

                <FastField
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroup}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <Field
                  name="location"
                  component={FieldHelper.ReadonlyField}
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

              <ApprovalsDefinition
                fieldName="planningApprovalSteps"
                values={values}
                title="Engagement planning approval process"
                addButtonLabel="Add a Planning Approval Step"
                setFieldTouched={setFieldTouched}
                setFieldValue={setFieldValue}
                approversFilters={approversFilters}
              />

              <ApprovalsDefinition
                fieldName="approvalSteps"
                values={values}
                title="Report publication approval process"
                addButtonLabel="Add a Publication Approval Step"
                setFieldTouched={setFieldTouched}
                setFieldValue={setFieldValue}
                approversFilters={approversFilters}
              />

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
    const operation = edit ? "updateLocation" : "createLocation"
    const location = new Location({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
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
    return API.mutation(edit ? GQL_UPDATE_LOCATION : GQL_CREATE_LOCATION, {
      location
    })
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
