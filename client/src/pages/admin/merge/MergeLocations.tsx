import { gql } from "@apollo/client"
import { Callout, Intent } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { LocationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ApprovalSteps from "components/approvals/ApprovalSteps"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import {
  customFieldsJSONString,
  mapReadonlyCustomFieldToComp
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import BaseGeoLocation from "components/GeoLocation"
import LocationTable from "components/LocationTable"
import MergeField from "components/MergeField"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import NavigationWarning from "components/NavigationWarning"
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
  getOtherSide,
  LeafletMap,
  LeafletMode,
  MERGE_SIDES,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Location } from "models"
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

interface MergeLocationsProps {
  pageDispatchers?: PageDispatchersPropType
}

const MergeLocations = ({ pageDispatchers }: MergeLocationsProps) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialLeftUuid = state?.initialLeftUuid
  const [isDirty, setIsDirty] = useState(false)
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
    setIsDirty(false)
  }, [location1, location2])
  useEffect(() => {
    setIsDirty(!!mergedLocation)
  }, [mergedLocation])

  return (
    <Container fluid>
      <NavigationWarning isBlocking={isDirty} />
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
              () => {
                dispatchMergeActions(
                  selectAllFields(location1, MERGE_SIDES.LEFT)
                )
                dispatchMergeActions(
                  setAMergedField("lat", location1.lat, MERGE_SIDES.LEFT)
                )
                dispatchMergeActions(
                  setAMergedField("lng", location1.lng, MERGE_SIDES.LEFT)
                )
              },
              MERGE_SIDES.LEFT,
              mergeState,
              null,
              !areAllSet(location1, location2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Location</h4>
            {getActionButton(
              () => {
                dispatchMergeActions(
                  selectAllFields(location2, MERGE_SIDES.RIGHT)
                )
                dispatchMergeActions(
                  setAMergedField("lat", location2.lat, MERGE_SIDES.RIGHT)
                )
                dispatchMergeActions(
                  setAMergedField("lng", location2.lng, MERGE_SIDES.RIGHT)
                )
              },
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
              <MergeField
                label="Avatar"
                value={
                  <EntityAvatarDisplay
                    avatar={mergedLocation.entityAvatar}
                    defaultAvatar={Location.relatedObjectType}
                    height={128}
                    width={128}
                    style={{
                      maxWidth: "100%",
                      display: "block",
                      margin: "0 auto"
                    }}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="entityAvatar"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
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
                    <LeafletMap
                      mapId="merged-location-map"
                      location={mergedLocation}
                      hideWhenEmpty={hideWhenEmpty}
                      mode={LeafletMode.marker}
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Shape (GeoJSON)"
                fieldName="geoJson"
                value={
                  mergedLocation.geoJson ? (
                    <LeafletMap
                      mapId="merged-shape-map"
                      location={mergedLocation}
                      hideWhenEmpty={hideWhenEmpty}
                      mode={LeafletMode.shapes}
                    />
                  ) : (
                    <em>No shape defined</em>
                  )
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
                  ([fieldName, fieldConfig]: [string, object]) => (
                    <MergeField
                      key={fieldName}
                      label={fieldConfig.label || fieldName}
                      value={mapReadonlyCustomFieldToComp({
                        fieldConfig,
                        parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
                        key: fieldName,
                        values: mergedLocation,
                        hideLabel: true
                      })}
                      align={ALIGN_OPTIONS.CENTER}
                      fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                      mergeState={mergeState}
                      dispatchMergeActions={dispatchMergeActions}
                    />
                  )
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
          onClick={() => {
            setIsDirty(false)
            mergeLocations()
          }}
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
        setIsDirty(true)
        setSaveError(error)
        jumpToTop()
      })
  }
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

const locationFilters = {
  allLocations: {
    label: "All locations"
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type
const locationFormats: string[] = Object.keys(Location.LOCATION_FORMATS)
interface LocationColumnProps {
  align: "left" | "right"
  label: string
  disabled?: boolean
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
  locationFormat: (typeof locationFormats)[number]
  setLocationFormat: (...args: unknown[]) => unknown
  locationFormatLabel: string
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
}: LocationColumnProps) => {
  const location = mergeState[align]
  const otherSide = mergeState[getOtherSide(align)]
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
          placeholder="Select a location to merge"
          value={location}
          disabledValue={otherSide}
          overlayColumns={["Name"]}
          overlayRenderRow={LocationOverlayRow}
          filterDefs={locationFilters}
          onChange={value => {
            value?.fixupFields()
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Location}
          valueKey="name"
          fields={Location.allFieldsQuery}
          addon={LOCATIONS_ICON}
          disabled={disabled}
          showRemoveButton={!disabled}
        />
      </ColTitle>
      {areAllSet(location) && (
        <fieldset>
          <MergeField
            label="Avatar"
            fieldName="entityAvatar"
            value={
              <EntityAvatarDisplay
                avatar={location.entityAvatar}
                defaultAvatar={Location.relatedObjectType}
                height={128}
                width={128}
                style={{
                  maxWidth: "100%",
                  display: "block",
                  margin: "0 auto"
                }}
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("entityAvatar", location.entityAvatar, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
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
                <LeafletMap
                  mapId={`merge-location-map-${align}`}
                  location={location}
                  hideWhenEmpty={hideWhenEmpty}
                  mode={LeafletMode.marker}
                />
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
          <MergeField
            label="Shape (GeoJSON)"
            fieldName="geoJson"
            value={
              <>
                {location.geoJson ? (
                  <LeafletMap
                    mapId={`merge-shape-map-${align}`}
                    location={location}
                    hideWhenEmpty={hideWhenEmpty}
                    mode={LeafletMode.shapes}
                  />
                ) : (
                  <em>No shape defined</em>
                )}
              </>
            }
            align={align}
            action={() => {
              if (location.geoJson) {
                dispatchMergeActions(
                  setAMergedField("geoJson", location.geoJson, align)
                )
              }
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
              )
            }
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
              )
            }
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
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.location.customFields &&
            Object.entries(Settings.fields.location.customFields).map(
              ([fieldName, fieldConfig]: [string, object]) => (
                <MergeField
                  key={fieldName}
                  fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                  label={fieldConfig.label || fieldName}
                  value={mapReadonlyCustomFieldToComp({
                    fieldConfig,
                    parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
                    key: fieldName,
                    values: location,
                    hideLabel: true
                  })}
                  align={align}
                  action={() =>
                    dispatchMergeActions(
                      setAMergedField(
                        `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                        location?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[fieldName],
                        align
                      )
                    )
                  }
                  mergeState={mergeState}
                  autoMerge
                  dispatchMergeActions={dispatchMergeActions}
                />
              )
            )}
        </fieldset>
      )}
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(MergeLocations)
