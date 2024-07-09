import { gql } from "@apollo/client"
import { Callout, Intent } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { LocationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ApprovalSteps from "components/ApprovalSteps"
import { customFieldsJSONString } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import BaseGeoLocation from "components/GeoLocation"
import LocationTable from "components/LocationTable"
import MergeField from "components/MergeField"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { convertLatLngToMGRS } from "geoUtils"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getLeafletMap,
  MERGE_SIDES,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import Settings from "settings"

const GQL_GET_LOCATION = gql`
  query ($uuid: String!) {
    location(uuid: $uuid) {
      ${Location.allFieldsQuery}
    }
  }
`

const GQL_MERGE_LOCATION = gql`
  mutation ($loserUuid: String!, $winnerLocation: LocationInput!) {
    mergeLocations(loserUuid: $loserUuid, winnerLocation: $winnerLocation)
  }
`

const MergeLocations = ({ pageDispatchers }) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialLeftUuid = state?.initialLeftUuid
  const [saveError, setSaveError] = useState(null)
  const [saveWarning, setSaveWarning] = useState(null)
  const [locationFormat, setLocationFormat] = useState(Location.locationFormat)
  const locationFormatLabel = Location.LOCATION_FORMAT_LABELS[locationFormat]
  const [mergeState, dispatchMergeActions] = useMergeObjects(
    MODEL_TO_OBJECT_TYPE.Location
  )

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Merge Locations")

  if (!mergeState[MERGE_SIDES.LEFT] && initialLeftUuid) {
    API.query(GQL_GET_LOCATION, {
      uuid: initialLeftUuid
    }).then(data => {
      const location = new Location(data.location)
      location.fixupFields()
      dispatchMergeActions(setMergeable(location, MERGE_SIDES.LEFT))
    })
  }
  const location1 = mergeState[MERGE_SIDES.LEFT]
  const location2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedLocation = mergeState.merged
  const hideWhenEmpty =
    !Location.hasCoordinates(location1) && !Location.hasCoordinates(location2)

  useEffect(() => {
    if (location1 && location2 && location1.type !== location2.type) {
      setSaveWarning(
        `Locations you are about to merge have different types. Before continuing,
          please be aware that this merge operation might cause problems in the future!`
      )
    } else {
      setSaveWarning(null)
    }
  }, [location1, location2])

  return (
    <Container fluid>
      <Row>
        <Messages error={saveError} warning={saveWarning} />
        <h4>Merge Locations Tool</h4>
      </Row>
      <Row>
        <Col md={4} id="left-merge-loc-col">
          <LocationColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.LEFT}
            label="Location 1"
            locationFormat={locationFormat}
            setLocationFormat={setLocationFormat}
            locationFormatLabel={locationFormatLabel}
            disabled={!!initialLeftUuid}
          />
        </Col>
        <Col md={4} id="mid-merge-loc-col">
          <MidColTitle>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(location1, MERGE_SIDES.LEFT)
                ),
              MERGE_SIDES.LEFT,
              mergeState,
              null,
              !areAllSet(location1, location2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Location</h4>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(location2, MERGE_SIDES.RIGHT)
                ),
              MERGE_SIDES.RIGHT,
              mergeState,
              null,
              !areAllSet(location1, location2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(location1, location2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent={Intent.WARNING}>
                Please select <strong>both</strong> locations to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(location1, location2, mergedLocation) && (
            <fieldset>
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.location.name}
                value={mergedLocation.name}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />

              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.location.type}
                value={Location.humanNameOfType(mergedLocation.type)}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="type"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />

              <MergeField
                label={locationFormatLabel}
                fieldName="displayedCoordinate"
                value={
                  <>
                    <BaseGeoLocation
                      locationFormat={locationFormat}
                      setLocationFormat={setLocationFormat}
                      label={locationFormatLabel}
                      editable={false}
                      coordinates={{
                        lat: mergedLocation.lat,
                        lng: mergedLocation.lng,
                        displayedCoordinate: mergedLocation.displayedCoordinate
                      }}
                    />
                    {getLeafletMap(
                      "merged-location-map",
                      mergedLocation,
                      hideWhenEmpty
                    )}
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.location.status}
                fieldName="status"
                value={mergedLocation.status}
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Parent locations"
                fieldName="parentLocations"
                value={
                  <LocationTable
                    locations={mergedLocation.parentLocations || []}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.location.description}
                value={
                  <RichTextEditor readOnly value={mergedLocation.description} />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="description"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {mergeState?.merged?.type === Location.LOCATION_TYPES.COUNTRY && (
                <>
                  <DictionaryField
                    wrappedComponent={MergeField}
                    dictProps={Settings.fields.location.digram}
                    value={mergedLocation.digram}
                    align={ALIGN_OPTIONS.CENTER}
                    fieldName="digram"
                    mergeState={mergeState}
                    dispatchMergeActions={dispatchMergeActions}
                  />
                  <DictionaryField
                    wrappedComponent={MergeField}
                    dictProps={Settings.fields.location.trigram}
                    value={mergedLocation.trigram}
                    align={ALIGN_OPTIONS.CENTER}
                    fieldName="trigram"
                    mergeState={mergeState}
                    dispatchMergeActions={dispatchMergeActions}
                  />
                </>
              )}
              <MergeField
                label="Planning Approval Steps"
                fieldName="planningApprovalSteps"
                value={
                  <ApprovalSteps
                    approvalSteps={mergedLocation.planningApprovalSteps}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Approval Steps"
                fieldName="approvalSteps"
                value={
                  <ApprovalSteps approvalSteps={mergedLocation.approvalSteps} />
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {Settings.fields.location.customFields &&
                Object.entries(Settings.fields.location.customFields).map(
                  ([fieldName, fieldConfig]) => {
                    const fieldValue =
                      mergedLocation?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[
                        fieldName
                      ]
                    return (
                      <MergeField
                        key={fieldName}
                        label={fieldConfig.label || fieldName}
                        value={JSON.stringify(fieldValue)}
                        align={ALIGN_OPTIONS.CENTER}
                        fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                        mergeState={mergeState}
                        dispatchMergeActions={dispatchMergeActions}
                      />
                    )
                  }
                )}
            </fieldset>
          )}
        </Col>
        <Col md={4} id="right-merge-loc-col">
          <LocationColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.RIGHT}
            label="Location 2"
            locationFormat={locationFormat}
            setLocationFormat={setLocationFormat}
            locationFormatLabel={locationFormatLabel}
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          variant="primary"
          onClick={mergeLocations}
          disabled={mergeState.notAllSet()}
        >
          Merge Locations
        </Button>
      </Row>
    </Container>
  )

  function mergeLocations() {
    const loser = mergedLocation.uuid === location1.uuid ? location2 : location1
    if (mergedLocation.type !== Location.LOCATION_TYPES.COUNTRY) {
      mergedLocation.digram = null
      mergedLocation.trigram = null
    }
    mergedLocation.customFields = customFieldsJSONString(mergedLocation)

    const winnerLocation = Location.filterClientSideFields(mergedLocation)

    API.mutation(GQL_MERGE_LOCATION, {
      loserUuid: loser.uuid,
      winnerLocation
    })
      .then(res => {
        if (res) {
          navigate(Location.pathFor({ uuid: mergedLocation.uuid }), {
            state: {
              success: "Locations merged. Displaying merged Location below."
            }
          })
        }
      })
      .catch(error => {
        setSaveError(error)
        jumpToTop()
      })
  }
}

MergeLocations.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const MidColTitle = styled.div`
  display: flex;
  height: 39px;
  margin-top: 19px;
  border-bottom: 1px solid #cccccc;
  border-top: 1px solid #cccccc;
  justify-content: space-between;
  align-items: center;
`

const ColTitle = styled(Form.Group)`
  height: 39px;
`

function getLocationFilters() {
  return {
    activeLocations: {
      label: "All locations"
    }
  }
}

const LocationColumn = ({
  align,
  label,
  disabled,
  mergeState,
  dispatchMergeActions,
  locationFormat,
  setLocationFormat,
  locationFormatLabel
}) => {
  const location = mergeState[align]
  const hideWhenEmpty =
    !Location.hasCoordinates(mergeState[MERGE_SIDES.LEFT]) &&
    !Location.hasCoordinates(mergeState[MERGE_SIDES.RIGHT])
  const idForLocation = label.replace(/\s+/g, "")
  return (
    <div>
      <label htmlFor={idForLocation}>{label}</label>
      <ColTitle controlId={idForLocation}>
        <AdvancedSingleSelect
          fieldName="location"
          fieldLabel="Select a location"
          placeholder="Select a location to merge"
          value={location}
          overlayColumns={["Name"]}
          overlayRenderRow={LocationOverlayRow}
          filterDefs={getLocationFilters()}
          onChange={value => {
            value?.fixupFields()
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Location}
          valueKey="name"
          fields={Location.allFieldsQuery}
          addon={LOCATIONS_ICON}
          vertical
          disabled={disabled}
          showRemoveButton={!disabled}
        />
      </ColTitle>
      {areAllSet(location) && (
        <fieldset>
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.location.name}
            fieldName="name"
            value={location.name}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("name", location.name, align)
              )
              dispatchMergeActions(
                setAMergedField("uuid", location.uuid, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />

          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.location.type}
            fieldName="type"
            value={Location.humanNameOfType(location.type)}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("type", location.type, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />

          <MergeField
            label={locationFormatLabel}
            fieldName="displayedCoordinate"
            value={
              <>
                <BaseGeoLocation
                  locationFormat={locationFormat}
                  setLocationFormat={setLocationFormat}
                  label={locationFormatLabel}
                  coordinates={{
                    lat: location.lat,
                    lng: location.lng,
                    displayedCoordinate: location.displayedCoordinate
                  }}
                />
                {getLeafletMap(
                  `merge-location-map-${align}`,
                  location,
                  hideWhenEmpty
                )}
              </>
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "displayedCoordinate",
                  convertLatLngToMGRS(location.lat, location.lng),
                  align
                )
              )
              dispatchMergeActions(setAMergedField("lat", location.lat, align))
              dispatchMergeActions(setAMergedField("lng", location.lng, align))
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.location.status}
            fieldName="status"
            value={location.status}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("status", location.status, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Parent locations"
            fieldName="parentLocations"
            value={<LocationTable locations={location.parentLocations || []} />}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "parentLocations",
                  location.parentLocations,
                  align
                )
              )}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.location.description}
            fieldName="description"
            value={<RichTextEditor readOnly value={location.description} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("description", location.description, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          {mergeState?.merged?.type === Location.LOCATION_TYPES.COUNTRY && (
            <>
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.location.digram}
                fieldName="digram"
                value={location.digram}
                align={align}
                action={() => {
                  dispatchMergeActions(
                    setAMergedField("digram", location.digram, align)
                  )
                }}
                mergeState={mergeState}
                autoMerge
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.location.trigram}
                fieldName="trigram"
                value={location.trigram}
                align={align}
                action={() => {
                  dispatchMergeActions(
                    setAMergedField("trigram", location.trigram, align)
                  )
                }}
                mergeState={mergeState}
                autoMerge
                dispatchMergeActions={dispatchMergeActions}
              />
            </>
          )}
          <MergeField
            label="Planning Approval Steps"
            fieldName="planningApprovalSteps"
            value={
              <ApprovalSteps approvalSteps={location.planningApprovalSteps} />
            }
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "planningApprovalSteps",
                  location.planningApprovalSteps,
                  align
                )
              )}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Approval Steps"
            fieldName="approvalSteps"
            value={<ApprovalSteps approvalSteps={location.approvalSteps} />}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField("approvalSteps", location.approvalSteps, align)
              )}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.location.customFields &&
            Object.entries(Settings.fields.location.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  location?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[fieldName]
                return (
                  <MergeField
                    key={fieldName}
                    fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                    label={fieldConfig.label || fieldName}
                    // To be able to see arrays and objects
                    value={JSON.stringify(fieldValue)}
                    align={align}
                    action={() =>
                      dispatchMergeActions(
                        setAMergedField(
                          `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                          fieldValue,
                          align
                        )
                      )}
                    mergeState={mergeState}
                    autoMerge
                    dispatchMergeActions={dispatchMergeActions}
                  />
                )
              }
            )}
        </fieldset>
      )}
    </div>
  )
}

LocationColumn.propTypes = {
  align: PropTypes.oneOf(["left", "right"]).isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  mergeState: PropTypes.object,
  dispatchMergeActions: PropTypes.func,
  locationFormat: PropTypes.oneOf(Object.keys(Location.LOCATION_FORMATS))
    .isRequired,
  setLocationFormat: PropTypes.func.isRequired,
  locationFormatLabel: PropTypes.string.isRequired
}

export default connect(null, mapPageDispatchersToProps)(MergeLocations)
