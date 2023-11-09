import { gql } from "@apollo/client"
import { Callout, Intent } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { LocationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ApprovalSteps from "components/ApprovalSteps"
import { customFieldsJSONString } from "components/CustomFields"
import BaseGeoLocation from "components/GeoLocation"
import LocationField from "components/MergeField"
import Messages from "components/Messages"
import {
  CUSTOM_FIELD_TYPE_DEFAULTS,
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
import { convertLatLngToMGRS } from "geoUtils"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  getLeafletMap,
  MERGE_SIDES,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Button, Col, Container, FormGroup, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import Settings from "settings"
import utils from "utils"

const GQL_MERGE_LOCATION = gql`
  mutation ($loserUuid: String!, $winnerLocation: LocationInput!) {
    mergeLocations(loserUuid: $loserUuid, winnerLocation: $winnerLocation)
  }
`

const MergeLocations = ({ pageDispatchers }) => {
  const navigate = useNavigate()
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

  const location1 = mergeState[MERGE_SIDES.LEFT]
  const location2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedLocation = mergeState.merged

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
              <LocationField
                label="Name"
                value={mergedLocation.name}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Name is required.")}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />

              <LocationField
                label="Type"
                value={Location.humanNameOfType(mergedLocation.type)}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Type is required.")}
                fieldName="type"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />

              <LocationField
                label={locationFormatLabel}
                fieldName="displayedCoordinate"
                value={
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
                }
                action={getClearButton(() => {
                  dispatchMergeActions(
                    setAMergedField("displayedCoordinate", null, null)
                  )
                  dispatchMergeActions(setAMergedField("lat", null, null))
                  dispatchMergeActions(setAMergedField("lng", null, null))
                })}
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {getLeafletMap("merged-location-map", mergedLocation)}
              <LocationField
                label="Status"
                fieldName="status"
                value={mergedLocation.status}
                align={ALIGN_OPTIONS.CENTER}
                action={getActivationButton(
                  Location.isActive(mergedLocation),
                  () =>
                    dispatchMergeActions(
                      setAMergedField(
                        "status",
                        Location.isActive(mergedLocation)
                          ? Location.STATUS.INACTIVE
                          : Location.STATUS.ACTIVE,
                        null
                      )
                    ),
                  Location.getInstanceName
                )}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <LocationField
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
              <LocationField
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
                      <LocationField
                        key={fieldName}
                        label={fieldConfig.label || fieldName}
                        value={JSON.stringify(fieldValue)}
                        align={ALIGN_OPTIONS.CENTER}
                        action={getClearButton(() =>
                          dispatchMergeActions(
                            setAMergedField(
                              `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                              CUSTOM_FIELD_TYPE_DEFAULTS[fieldConfig.type],
                              null
                            )
                          )
                        )}
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
          disabled={
            !areAllSet(
              location1,
              location2,
              mergedLocation?.name,
              mergedLocation?.type
            )
          }
        >
          Merge Locations
        </Button>
      </Row>
    </Container>
  )

  function mergeLocations() {
    const loser = mergedLocation.uuid === location1.uuid ? location2 : location1
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

function getLocationFilters() {
  const locationFilters = {
    activeLocations: {
      label: "All locations"
    }
  }
  return locationFilters
}

const LocationColumn = ({
  align,
  label,
  mergeState,
  dispatchMergeActions,
  locationFormat,
  setLocationFormat,
  locationFormatLabel
}) => {
  const location = mergeState[align]
  const idForLocation = label.replace(/\s+/g, "")
  return (
    <div>
      <label htmlFor={idForLocation}>{label}</label>
      <FormGroup controlId={idForLocation}>
        <AdvancedSingleSelect
          fieldName="location"
          fieldLabel="Select a location"
          placeholder="Select a location to merge"
          value={location}
          overlayColumns={["Name"]}
          overlayRenderRow={LocationOverlayRow}
          filterDefs={getLocationFilters()}
          onChange={value => {
            if (value?.customFields) {
              value[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
                value.customFields
              )
            }
            if (value) {
              value.displayedCoordinate = convertLatLngToMGRS(
                value.lat,
                value.lng
              )
            }
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Location}
          valueKey="name"
          fields={Location.allFieldsQuery}
          addon={LOCATIONS_ICON}
          vertical
        />
      </FormGroup>
      {areAllSet(location) && (
        <fieldset>
          <LocationField
            label="Name"
            fieldName="name"
            value={location.name}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("name", location.name, align)
                )
                dispatchMergeActions(
                  setAMergedField("uuid", location.uuid, align)
                )
              },
              align,
              mergeState,
              "name"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />

          <LocationField
            label="Type"
            fieldName="type"
            value={Location.humanNameOfType(location.type)}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("type", location.type, align)
                )
              },
              align,
              mergeState,
              "type"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />

          <LocationField
            label={locationFormatLabel}
            fieldName="displayedCoordinate"
            value={
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
            }
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField(
                    "displayedCoordinate",
                    convertLatLngToMGRS(location.lat, location.lng),
                    align
                  )
                )
                dispatchMergeActions(
                  setAMergedField("lat", location.lat, align)
                )
                dispatchMergeActions(
                  setAMergedField("lng", location.lng, align)
                )
              },
              align,
              mergeState,
              "displayedCoordinate"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          {getLeafletMap(`merge-location-map-${align}`, location)}
          <LocationField
            label="Status"
            fieldName="status"
            value={location.status}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("status", location.status, align)
                )
              },
              align,
              mergeState,
              "status"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <LocationField
            label="Planning Approval Steps"
            fieldName="planningApprovalSteps"
            value={
              <ApprovalSteps approvalSteps={location.planningApprovalSteps} />
            }
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField(
                    "planningApprovalSteps",
                    location.planningApprovalSteps,
                    align
                  )
                ),
              align,
              mergeState,
              "planningApprovalSteps"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <LocationField
            label="Approval Steps"
            fieldName="approvalSteps"
            value={<ApprovalSteps approvalSteps={location.approvalSteps} />}
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField(
                    "approvalSteps",
                    location.approvalSteps,
                    align
                  )
                ),
              align,
              mergeState,
              "approvalSteps"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.location.customFields &&
            Object.entries(Settings.fields.location.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  location[DEFAULT_CUSTOM_FIELDS_PARENT][fieldName]
                return (
                  <LocationField
                    key={fieldName}
                    fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                    label={fieldConfig.label || fieldName}
                    // To be able to see arrays and ojects
                    value={JSON.stringify(fieldValue)}
                    align={align}
                    action={getActionButton(
                      () =>
                        dispatchMergeActions(
                          setAMergedField(
                            `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                            fieldValue,
                            align
                          )
                        ),
                      align,
                      mergeState,
                      `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`
                    )}
                    mergeState={mergeState}
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
  mergeState: PropTypes.object,
  dispatchMergeActions: PropTypes.func,
  locationFormat: PropTypes.oneOf(Object.keys(Location.LOCATION_FORMATS))
    .isRequired,
  setLocationFormat: PropTypes.func.isRequired,
  locationFormatLabel: PropTypes.string.isRequired
}

export default connect(null, mapPageDispatchersToProps)(MergeLocations)
