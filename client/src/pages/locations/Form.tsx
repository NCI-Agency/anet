import { gql } from "@apollo/client"
import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import { LocationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import UploadAttachment from "components/Attachment/UploadAttachment"
import EntityAvatarComponent from "components/avatar/EntityAvatarComponent"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GeoLocation from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import LocationTable from "components/LocationTable"
import { MessagesWithConflict } from "components/Messages"
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
import React, { useContext, useEffect, useMemo, useState } from "react"
import { Button, Col, FormSelect, Row } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import Settings from "settings"
import { useDebouncedCallback } from "use-debounce"
import utils from "utils"

const GQL_CREATE_LOCATION = gql`
  mutation ($location: LocationInput!) {
    createLocation(location: $location) {
      uuid
    }
  }
`
const GQL_UPDATE_LOCATION = gql`
  mutation ($location: LocationInput!, $force: Boolean) {
    updateLocation(location: $location, force: $force)
  }
`

const GQL_GET_LOCATION_COUNT = gql`
  query ($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      totalCount
    }
  }
`

const MIN_CHARS_FOR_DUPLICATES = 3

// Location types to be shown to admins in the new location page.
const LOCATION_TYPES_ADMIN = [
  Location.LOCATION_TYPES.POINT_LOCATION,
  Location.LOCATION_TYPES.GEOGRAPHICAL_AREA,
  Location.LOCATION_TYPES.TOWN,
  Location.LOCATION_TYPES.MUNICIPALITY,
  Location.LOCATION_TYPES.COUNTRY,
  Location.LOCATION_TYPES.VIRTUAL_LOCATION
]

// Location types to be shown to superusers in the new location page.
const LOCATION_TYPES_SUPERUSER =
  Settings?.fields?.location?.superuserTypeOptions

const LOCATION_TYPES_REGULARUSER =
  Settings?.fields?.location?.regularuserTypeOptions

const locationFilters = {
  allLocations: {
    label: "All locations"
  }
}

interface LocationFormProps {
  initialValues: any
  title?: string
  edit?: boolean
  notesComponent?: React.ReactNode
  afterSaveActions?: (...args: unknown[]) => unknown
  afterCancelActions?: (...args: unknown[]) => unknown
}

const LocationForm = ({
  edit = false,
  title = "",
  initialValues = new Location(),
  notesComponent,
  afterSaveActions,
  afterCancelActions
}: LocationFormProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [attachmentList, setAttachmentList] = useState(
    initialValues?.attachments
  )
  const [showSimilarLocations, setShowSimilarLocations] = useState(false)
  const [showSimilarLocationsMessage, setShowSimilarLocationsMessage] =
    useState(false)
  const [locationName, setLocationName] = useState(initialValues?.name)
  const regularUsersCanCreateLocations = Settings.regularUsersCanCreateLocations
  const canEditName =
    (!edit && (regularUsersCanCreateLocations || currentUser.isSuperuser())) ||
    (edit && currentUser.isAdmin())
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser.isAdmin())
  const avatarMimeTypes = Settings.fields.attachment.fileTypes
    .filter(fileType => fileType.avatar)
    .map(fileType => fileType.mimeType)
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
  if (currentUser.position?.organization?.uuid) {
    approversFilters.myColleagues = {
      label: "My colleagues",
      queryVars: {
        matchPersonName: true,
        organizationUuid: currentUser.position.organization.uuid
      }
    }
  }
  const checkPotentialDuplicatesDebounced = useDebouncedCallback(
    checkPotentialDuplicates,
    400
  )
  useEffect(() => {
    checkPotentialDuplicatesDebounced(locationName)
  }, [checkPotentialDuplicatesDebounced, locationName])

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
        values,
        validateForm,
        resetForm,
        setSubmitting,
        submitForm
      }) => {
        const imageAttachments = attachmentList?.filter(a =>
          avatarMimeTypes.includes(a.mimeType)
        )
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
            <MessagesWithConflict
              error={error}
              objectType="Location"
              onCancel={onCancel}
              onConfirm={() => {
                resetForm({ values, isSubmitting: true })
                onSubmit(values, { resetForm, setSubmitting }, true)
              }}
            />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <Row>
                  {edit && (
                    <Col lg={4} xl={3} className="text-center">
                      <EntityAvatarComponent
                        initialAvatar={initialValues.entityAvatar}
                        relatedObjectType={Location.relatedObjectType}
                        relatedObjectUuid={initialValues.uuid}
                        relatedObjectName={initialValues.name}
                        editMode={attachmentEditEnabled}
                        imageAttachments={imageAttachments}
                      />
                    </Col>
                  )}
                  <Col lg={edit && 8} xl={edit && 9}>
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.location.name}
                      name="name"
                      component={FieldHelper.InputField}
                      disabled={!canEditName}
                      onChange={event => {
                        setFieldValue("name", event.target.value)
                        setLocationName(event.target.value)
                      }}
                      extraColElem={
                        showSimilarLocationsMessage ? (
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

                    {values.type !==
                      Location.LOCATION_TYPES.VIRTUAL_LOCATION && (
                      <GeoLocation
                        editable
                        coordinates={coordinates}
                        isSubmitting={isSubmitting}
                        setFieldValue={setFieldValue}
                        setFieldTouched={setFieldTouched}
                      />
                    )}

                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={Settings.fields.location.status}
                      name="status"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      buttons={statusButtons}
                      onChange={value => setFieldValue("status", value)}
                    />
                  </Col>
                </Row>
              </Fieldset>
              <Fieldset title="Additional information">
                {values.type === Location.LOCATION_TYPES.COUNTRY && (
                  <>
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.location.digram}
                      name="digram"
                      component={FieldHelper.InputField}
                    />

                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.location.trigram}
                      name="trigram"
                      component={FieldHelper.InputField}
                    />
                  </>
                )}

                <Field
                  name="parentLocations"
                  label="Parent locations"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("parentLocations", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("parentLocations", value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="parentLocations"
                      placeholder="Select parent locations…"
                      value={values.parentLocations}
                      renderSelected={
                        <LocationTable
                          id="location-parentLocations"
                          locations={values.parentLocations}
                          noLocationsMessage="No locations selected"
                          showDelete
                        />
                      }
                      overlayColumns={["Name"]}
                      overlayRenderRow={LocationOverlayRow}
                      filterDefs={locationFilters}
                      objectType={Location}
                      fields={Location.autocompleteQuery}
                      addon={LOCATIONS_ICON}
                    />
                  }
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

              {values.type !== Location.LOCATION_TYPES.VIRTUAL_LOCATION && (
                <LeafletMap
                  location={values}
                  shapes={values.geoJson ? [values.geoJson] : []}
                  onMove={(event, map) =>
                    updateCoordinateFields(
                      map.wrapLatLng(event.target.getLatLng())
                    )
                  }
                  onMapClick={(event, map) =>
                    updateCoordinateFields(map.wrapLatLng(event.latlng))
                  }
                />
              )}

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
          const parsedMgrs = convertLatLngToMGRS(parsedLat, parsedLng)
          setFieldTouched("lat", false, false)
          setFieldTouched("lng", false, false)
          setFieldTouched("displayedCoordinate", false, false)
          setFieldValue("lat", parsedLat)
          setFieldValue("lng", parsedLng)
          setFieldValue("displayedCoordinate", parsedMgrs)
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

  function onSubmit(values, form, force) {
    return save(values, force)
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
      ...values,
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
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

  function save(values, force) {
    const location = new Location(values).filterClientSideFields("customFields")
    // strip unnecessary fields
    location.parentLocations = values.parentLocations?.map(l =>
      utils.getReference(l)
    )
    if (location.type !== Location.LOCATION_TYPES.COUNTRY) {
      location.digram = null
      location.trigram = null
    }
    location.customFields = customFieldsJSONString(values)
    return API.mutation(edit ? GQL_UPDATE_LOCATION : GQL_CREATE_LOCATION, {
      location,
      force
    })
  }

  async function checkPotentialDuplicates(locationName) {
    if (!edit && locationName.length >= MIN_CHARS_FOR_DUPLICATES) {
      const locationQuery = {
        pageSize: 1,
        text: locationName
      }
      try {
        const response = await API.query(GQL_GET_LOCATION_COUNT, {
          locationQuery
        })
        setError(null)
        setShowSimilarLocationsMessage(response?.locationList.totalCount > 0)
      } catch (error) {
        setError(error)
        setShowSimilarLocationsMessage(false)
        jumpToTop()
      }
    } else {
      setError(null)
      setShowSimilarLocationsMessage(false)
    }
  }
}

interface LeafletMapProps {
  location: any
  onMove: (event, map) => void
  onMapClick: (event, map) => void
  shapes?: string[]
}

const LeafletMap = ({
  location,
  onMove,
  onMapClick,
  shapes
}: LeafletMapProps) => {
  const markers = useMemo(() => {
    const marker = {
      id: location.uuid || 0,
      name: _escape(location.name) || "", // escape HTML in location name!
      draggable: true,
      autoPan: true,
      onMove
    }
    if (Location.hasCoordinates(location)) {
      Object.assign(marker, {
        lat: Number(location.lat),
        lng: Number(location.lng)
      })
    }
    return [marker]
  }, [location, onMove])

  return (
    <>
      <h3>Drag the marker below to set the location</h3>
      <Leaflet markers={markers} onMapClick={onMapClick} shapes={shapes} />
    </>
  )
}

export default LocationForm
