import { gql } from "@apollo/client"
import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import UploadAttachment from "components/Attachment/UploadAttachment"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GeoLocation from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import SimilarObjectsModal from "components/SimilarObjectsModal"
import { FastField, Field, Form, Formik } from "formik"
import { convertLatLngToMGRS, parseCoordinate } from "geoUtils"
import _escape from "lodash/escape"
import _isEqual from "lodash/isEqual"
import { Location, Position } from "models"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button, FormSelect } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import Settings from "settings"

const GQL_CREATE_LOCATION = gql`
  mutation ($location: LocationInput!) {
    createLocation(location: $location) {
      uuid
    }
  }
`
const GQL_UPDATE_LOCATION = gql`
  mutation ($location: LocationInput!) {
    updateLocation(location: $location)
  }
`
const MIN_CHARS_FOR_DUPLICATES = 3

// Location types to be shown to admins in the new location page.
const LOCATION_TYPES_ADMIN = [
  Location.LOCATION_TYPES.POINT_LOCATION,
  Location.LOCATION_TYPES.GEOGRAPHICAL_AREA,
  Location.LOCATION_TYPES.VIRTUAL_LOCATION
]

// Location types to be shown to superusers in the new location page.
const LOCATION_TYPES_SUPERUSER =
  Settings?.fields?.location?.superuserTypeOptions

const LOCATION_TYPES_REGULARUSER =
  Settings?.fields?.location?.regularuserTypeOptions

const LocationForm = ({
  edit,
  title,
  initialValues,
  notesComponent,
  afterSaveActions,
  afterCancelActions
}) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [attachmentList, setAttachmentList] = useState(
    initialValues?.attachments
  )
  const [showSimilarLocations, setShowSimilarLocations] = useState(false)
  const regularUsersCanCreateLocations = Settings.regularUsersCanCreateLocations
  const canEditName =
    (!edit && (regularUsersCanCreateLocations || currentUser.isSuperuser())) ||
    (edit && currentUser.isAdmin())
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser.isAdmin())
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
    allPositions: {
      label: "All positions",
      queryVars: {
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
        validateForm,
        submitForm
      }) => {
        const marker = {
          id: values.uuid || 0,
          name: _escape(values.name) || "", // escape HTML in location name!
          draggable: true,
          autoPan: true,
          onMove: (event, map) =>
            updateCoordinateFields(map.wrapLatLng(event.target.getLatLng()))
        }
        if (Location.hasCoordinates(values)) {
          Object.assign(marker, {
            lat: parseFloat(values.lat),
            lng: parseFloat(values.lng)
          })
        }
        const action = (
          <>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Location
            </Button>
            {notesComponent}
          </>
        )

        const coordinates = {
          lat: values.lat,
          lng: values.lng,
          displayedCoordinate: values.displayedCoordinate
        }

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.location.name}
                  name="name"
                  component={FieldHelper.InputField}
                  disabled={!canEditName}
                  extraColElem={
                    !edit && values.name.length >= MIN_CHARS_FOR_DUPLICATES ? (
                      <>
                        <Button
                          onClick={() => setShowSimilarLocations(true)}
                          variant="outline-secondary"
                        >
                          <Icon
                            icon={IconNames.WARNING_SIGN}
                            intent={Intent.WARNING}
                            size={IconSize.STANDARD}
                            style={{ margin: "0 6px" }}
                          />
                          Possible Duplicates
                        </Button>
                      </>
                    ) : undefined
                  }
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.location.type}
                  name="type"
                  component={FieldHelper.SpecialField}
                  disabled={!canEditName}
                  onChange={event => {
                    // validation will be done by setFieldValue
                    setFieldValue("type", event.target.value, true)
                  }}
                  widget={
                    <FormSelect className="location-type-form-group form-control">
                      <option value="">
                        {!canEditName
                          ? Location.humanNameOfType(values.type)
                          : "Please select a location type"}
                      </option>
                      {getDropdownOptionsForUser(currentUser).map(type => (
                        <option key={type} value={type}>
                          {Location.humanNameOfType(type)}
                        </option>
                      ))}
                    </FormSelect>
                  }
                />

                <GeoLocation
                  editable
                  coordinates={coordinates}
                  isSubmitting={isSubmitting}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.location.status}
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.location.description}
                  name="description"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // prevent initial unnecessary render of RichTextEditor
                    if (!_isEqual(values.description, value)) {
                      setFieldValue("description", value, true)
                    }
                  }}
                  onHandleBlur={() => {
                    // validation will be done by setFieldValue
                    setFieldTouched("description", true, false)
                  }}
                  widget={
                    <RichTextEditor
                      className="description"
                      placeholder={
                        Settings.fields.location.description?.placeholder
                      }
                    />
                  }
                />

                {edit && attachmentEditEnabled && (
                  <Field
                    name="uploadAttachments"
                    label="Attachments"
                    component={FieldHelper.SpecialField}
                    widget={
                      <UploadAttachment
                        attachments={attachmentList}
                        updateAttachments={setAttachmentList}
                        relatedObjectType={Location.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                      />
                    }
                    onHandleBlur={() => {
                      setFieldTouched("uploadAttachments", true, false)
                    }}
                  />
                )}
              </Fieldset>

              <h3>Drag the marker below to set the location</h3>
              <Leaflet
                markers={[marker]}
                onMapClick={(event, map) =>
                  updateCoordinateFields(map.wrapLatLng(event.latlng))}
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
                />
              )}

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    id="formBottomSubmit"
                    variant="primary"
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

        function updateCoordinateFields(latLng) {
          const parsedLat = parseCoordinate(latLng.lat)
          const parsedLng = parseCoordinate(latLng.lng)
          setFieldValue("lat", parsedLat)
          setFieldValue("lng", parsedLng)
          setFieldValue(
            "displayedCoordinate",
            convertLatLngToMGRS(parsedLat, parsedLng)
          )
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
        return LOCATION_TYPES_ADMIN
      case Position.TYPE.SUPERUSER:
        return LOCATION_TYPES_SUPERUSER
      default:
        return LOCATION_TYPES_REGULARUSER
    }
  }

  function onCancel() {
    if (afterCancelActions) {
      // Whatever logic the calling component implements
      afterCancelActions()
    } else {
      // Default behaviour, navigate back
      navigate(-1)
    }
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
    location.name = values.name
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (afterSaveActions) {
      // Whatever logic the calling component defines
      afterSaveActions(location)
    } else {
      // Default behaviour, navigate depending on edit mode
      if (!edit) {
        navigate(Location.pathForEdit(location), { replace: true })
      }
      navigate(Location.pathFor(location), {
        state: { success: "Location saved" }
      })
    }
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
  edit: PropTypes.bool,
  notesComponent: PropTypes.node,
  afterSaveActions: PropTypes.func,
  afterCancelActions: PropTypes.func
}

LocationForm.defaultProps = {
  initialValues: new Location(),
  title: "",
  edit: false
}

export default LocationForm
