import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GeoLocation from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import SimilarObjectsModal from "components/SimilarObjectsModal"
import { FastField, Form, Formik } from "formik"
import { convertLatLngToMGRS, parseCoordinate } from "geoUtils"
import _escape from "lodash/escape"
import { Location, Position } from "models"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import Settings from "settings"

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
const MIN_CHARS_FOR_DUPLICATES = 3

const LocationForm = ({ edit, title, initialValues }) => {
  const { currentUser } = useContext(AppContext)
  const history = useHistory()
  const [error, setError] = useState(null)
  const [showSimilarLocations, setShowSimilarLocations] = useState(false)
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

  // Location types to be shown to admins in the new location page.
  const locationTypesAdmin = [
    Location.LOCATION_TYPES.ADVISOR_LOCATION,
    Location.LOCATION_TYPES.PRINCIPAL_LOCATION,
    Location.LOCATION_TYPES.PINPOINT_LOCATION,
    Location.LOCATION_TYPES.GEOGRAPHICAL_AREA,
    Location.LOCATION_TYPES.VIRTUAL_LOCATION
  ]

  // Location types to be shown to super users in the new location page.
  const locationTypesSuperUser = [
    Location.LOCATION_TYPES.ADVISOR_LOCATION,
    Location.LOCATION_TYPES.PRINCIPAL_LOCATION
  ]

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
        validateForm,
        submitForm
      }) => {
        const marker = {
          id: values.uuid || 0,
          name: _escape(values.name) || "", // escape HTML in location name!
          type: _escape(values.type) || "", // escape HTML in location type!
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
                  extraColElem={
                    !edit && values.name.length >= MIN_CHARS_FOR_DUPLICATES ? (
                      <>
                        <Button onClick={() => setShowSimilarLocations(true)}>
                          <Icon
                            icon={IconNames.WARNING_SIGN}
                            intent={Intent.WARNING}
                            iconSize={IconSize.STANDARD}
                            style={{ margin: "0 6px" }}
                          />
                          Possible Duplicates
                        </Button>
                      </>
                    ) : undefined
                  }
                />

                <FastField
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <FastField
                  name="type"
                  component={FieldHelper.DropdownField}
                  disabled={!canEditName}
                  options={getDropdownOptionsForUser(currentUser)}
                  placeholder={"Please select a location type"}
                  humanReadableFunction={Location.humanNameOfType}
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
              {Settings.fields.location.customFields && (
                <Fieldset title="Location information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.location.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}

              {showSimilarLocations && (
                <SimilarObjectsModal
                  objectType="Location"
                  userInput={`${values.name}`}
                  onCancel={() => {
                    setShowSimilarLocations(false)
                  }}
                >
                </SimilarObjectsModal>
              )}

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

  /**
   * Depending on the position type of the logged in user, return corresponding
   * location type list shown at create a new location page.
   * @param {Object} user current user logged in to the system.
   * @returns Object[]
   */
  function getDropdownOptionsForUser(user) {
    switch (user.position.type) {
      case Position.TYPE.ADMINISTRATOR:
        return locationTypesAdmin
      case Position.TYPE.SUPER_USER:
        return locationTypesSuperUser
      default:
        return []
    }
  }

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
    // reset the form to latest values
    // to avoid unsaved changes propmt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (!edit) {
      history.replace(Location.pathForEdit(location))
    }
    history.push(Location.pathFor(location), {
      success: "Location saved"
    })
  }

  function save(values) {
    const location = new Location(values).filterClientSideFields("customFields")
    location.customFields = customFieldsJSONString(values)
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
