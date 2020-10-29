import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet from "components/Leaflet"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import { FastField, Form, Formik } from "formik"
import { convertLatLngToMGRS, parseCoordinate } from "geoUtils"
import _escape from "lodash/escape"
import { Location, Position } from "models"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import GeoLocation from "./GeoLocation"

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

const LocationForm = ({ edit, title, initialValues }) => {
  const { currentUser } = useContext(AppContext)
  const history = useHistory()
  const [error, setError] = useState(null)
  const canEditName =
    (!edit && currentUser.isSuperUser()) || (edit && currentUser.isAdmin())
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Model.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Model.STATUS.INACTIVE,
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
      initialValues={{
        ...initialValues,
        displayedCoordinate: convertLatLngToMGRS(
          parseCoordinate(initialValues.lat),
          parseCoordinate(initialValues.lng)
        )
      }}
    >
      {({
        isSubmitting,
        dirty,
        setFieldTouched,
        setFieldValue,
        setValues,
        values,
        submitForm
      }) => {
        const marker = {
          id: values.uuid || 0,
          name: _escape(values.name) || "", // escape HTML in location name!
          draggable: true,
          autoPan: true,
          onMove: (event, map) => {
            const latLng = map.wrapLatLng(event.target.getLatLng())
            updateCoordinateFields(values, latLng)
          }
        }
        if (Location.hasCoordinates(values)) {
          Object.assign(marker, {
            lat: parseFloat(values.lat),
            lng: parseFloat(values.lng)
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

        const coordinates = {
          lat: values.lat,
          lng: values.lng,
          displayedCoordinate: values.displayedCoordinate
        }

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
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <GeoLocation
                  editable
                  coordinates={coordinates}
                  isSubmitting={isSubmitting}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                />
              </Fieldset>

              <h3>Drag the marker below to set the location</h3>
              <Leaflet
                markers={[marker]}
                onMapClick={(event, map) => {
                  const latLng = map.wrapLatLng(event.latlng)
                  updateCoordinateFields(values, latLng)
                }}
              />

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

        function updateCoordinateFields(values, latLng) {
          const parsedLat = parseCoordinate(latLng.lat)
          const parsedLng = parseCoordinate(latLng.lng)
          setValues({
            ...values,
            lat: parsedLat,
            lng: parsedLng,
            displayedCoordinate: convertLatLngToMGRS(parsedLat, parsedLng)
          })
        }
      }}
    </Formik>
  )

  function onCancel() {
    history.goBack()
  }

  function onSubmit(values, form) {
    return save(values)
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

  function save(values) {
    const location = Object.without(
      new Location(values),
      "notes",
      "displayedCoordinate"
    )
    return API.mutation(edit ? GQL_UPDATE_LOCATION : GQL_CREATE_LOCATION, {
      location
    })
  }
}

LocationForm.propTypes = {
  initialValues: PropTypes.instanceOf(Location).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool
}

LocationForm.defaultProps = {
  initialValues: new Location(),
  title: "",
  edit: false
}

export default LocationForm
