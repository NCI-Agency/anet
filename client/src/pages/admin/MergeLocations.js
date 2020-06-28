import { Button, Callout, Tooltip } from "@blueprintjs/core"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import { LocationOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import ApprovalSteps, {
  PLANNING_APPROVAL,
  PUBLICATION_APPROVAL
} from "components/approvals/ApprovalSteps"
import Leaflet from "components/Leaflet"
import { GRAPHQL_NOTES_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import _escape from "lodash/escape"
import { Location } from "models"
import GeoLocation from "pages/locations/GeoLocation"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { connect } from "react-redux"
import { toast } from "react-toastify"
import LOCATIONS_ICON from "resources/locations.png"

const locationFilters = {
  allLocations: {
    label: "All locations",
    queryVars: {}
  }
}

const selectFields = `
  uuid
  name
  lat
  lng
  status
  planningApprovalSteps {
    uuid
    name
    approvers {
      uuid
      name
      person {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
    }
  }
  approvalSteps {
    uuid
    name
    approvers {
      uuid
      name
      person {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
    }
  }
  ${GRAPHQL_NOTES_FIELDS}
`

const LocationColumn = ({
  location,
  setLocation,
  setFieldValue,
  reversed,
  style
}) => {
  return (
    <div style={style}>
      <AdvancedSingleSelect
        fieldName="location"
        placeholder="Select location to merge..."
        value={location}
        overlayColumns={["Name"]}
        overlayRenderRow={LocationOverlayRow}
        filterDefs={locationFilters}
        objectType={Location}
        fields={selectFields}
        valueKey="name"
        addon={LOCATIONS_ICON}
        onChange={setLocation}
      />
      {location && (
        <>
          <LocationField
            label="Name"
            value={location.name}
            align={reversed ? "right" : "left"}
            reversed={reversed}
            action={getActionButton(() => setFieldValue("name", location.name))}
          />
          <LocationField
            label="Status"
            value={location.status}
            align={reversed ? "right" : "left"}
            reversed={reversed}
            action={getActionButton(() =>
              setFieldValue("status", location.status)
            )}
          />
          <LocationField
            label="Location"
            value={<GeoLocation lat={location.lat} lng={location.lng} />}
            align={reversed ? "right" : "left"}
            reversed={reversed}
            action={getActionButton(() => {
              setFieldValue("lat", location.lat)
              setFieldValue("lng", location.lng)
            })}
          />
          <Leaflet
            mapId={"map-" + location.uuid}
            markers={[
              {
                id: "marker-" + location.uuid,
                name: _escape(location.name) || "", // escape HTML in location name!
                lat: Location.hasCoordinates(location) ? location.lat : null,
                lng: Location.hasCoordinates(location) ? location.lng : null
              }
            ]}
          />
          <div className={"merge-loc-fset" + (reversed ? " reversed" : "")}>
            <ApprovalSteps
              type={PLANNING_APPROVAL}
              steps={location.planningApprovalSteps}
              fieldSetAction={getActionButton(() =>
                setFieldValue(
                  "planningApprovalSteps",
                  location.planningApprovalSteps
                )
              )}
            />
          </div>

          <div className={"merge-loc-fset" + (reversed ? " reversed" : "")}>
            <ApprovalSteps
              type={PUBLICATION_APPROVAL}
              steps={location.approvalSteps}
              fieldSetAction={getActionButton(() =>
                setFieldValue("approvalSteps", location.approvalSteps)
              )}
            />
          </div>
        </>
      )}
    </div>
  )

  function getActionButton(onClickAction) {
    return (
      <small>
        <Button
          icon={reversed ? "double-chevron-left" : ""}
          rightIcon={reversed ? "" : "double-chevron-right"}
          intent="primary"
          text="Use value"
          onClick={onClickAction}
        />
      </small>
    )
  }
}

LocationColumn.propTypes = {
  location: PropTypes.instanceOf(Location),
  setLocation: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  reversed: PropTypes.bool,
  style: PropTypes.object
}

LocationColumn.defaultProps = {
  reversed: false
}

const LocationField = ({ label, value, align, reversed, action }) => {
  return (
    <div
      style={{
        borderBottom: "1px solid #CCCCCC",
        display: "flex",
        flexDirection: reversed ? "row-reverse" : "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0"
      }}
    >
      <div style={{ flex: "1 1 auto" }}>
        <div
          style={{
            fontWeight: "bold",
            textAlign: align || "center",
            textDecoration: "underline"
          }}
        >
          {label}
        </div>
        <div style={{ textAlign: align || "center" }}>{value}</div>
      </div>
      {action}
    </div>
  )
}

LocationField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  align: PropTypes.string,
  reversed: PropTypes.bool,
  action: PropTypes.node
}

const MergeLocations = ({ pageDispatchers }) => {
  const [mergedLocation, setMergedLocation] = useState(new Location())
  const [location01, setLocation01] = useState()
  const [location02, setLocation02] = useState()

  const setLocationFn01 = value => {
    if (location02?.uuid && value?.uuid && location02.uuid === value.uuid) {
      toast.warning("Please select a different location!")
    } else {
      setMergedLocation(new Location())
      setLocation01(null) // workaround for map already initialized error
      if (value) {
        setTimeout(() => setLocation01(new Location(value)))
      }
    }
  }

  const setLocationFn02 = value => {
    if (location01?.uuid && value?.uuid && location01.uuid === value.uuid) {
      toast.warning("Please select a different location!")
    } else {
      setMergedLocation(new Location())
      setLocation02(null) // workaround for map already initialized error
      if (value) {
        setTimeout(() => setLocation02(new Location(value)))
      }
    }
  }

  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  return (
    <div>
      <h2 className="form-header">Merge Locations Tool</h2>
      <div style={{ display: "flex" }}>
        <LocationColumn
          location={location01}
          setLocation={setLocationFn01}
          setFieldValue={setFieldValue}
          style={{ flex: "0 0 33%" }}
        />
        <div style={{ margin: "0 0.5%", flex: "0 0 33%" }}>
          <h4
            style={{
              height: "39px",
              margin: 0,
              borderBottom: "1px solid #CCCCCC",
              borderTop: "1px solid #CCCCCC",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <small>
              <Button
                rightIcon="double-chevron-right"
                intent="primary"
                text="Use All"
                onClick={() => setAllFields(location01)}
                disabled={!location01 || !location02}
              />
            </small>
            <span>Merged Location</span>
            <small>
              <Button
                icon="double-chevron-left"
                intent="primary"
                text="Use All"
                onClick={() => setAllFields(location02)}
                disabled={!location01 || !location02}
              />
            </small>
          </h4>
          {(!location01 || !location02) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="warning">
                Please select both locations to proceed...
              </Callout>
            </div>
          )}
          {location01 && location02 && !mergedLocation.name && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="primary">
                Please choose name to proceed...
              </Callout>
            </div>
          )}
          {location01 && location02 && mergedLocation?.name && (
            <>
              <LocationField
                label="Name"
                value={mergedLocation.name}
                action={
                  <Tooltip content="Name is required." intent="primary">
                    <Button minimal icon="info-sign" intent="primary" />
                  </Tooltip>
                }
              />
              <LocationField
                label="Status"
                value={mergedLocation.status}
                action={
                  <Tooltip
                    content={
                      mergedLocation.isActive()
                        ? "Deactivate location"
                        : "Activate location"
                    }
                    intent={mergedLocation.isActive() ? "danger" : "success"}
                  >
                    <Button
                      icon={mergedLocation.isActive() ? "stop" : "play"}
                      outlined
                      intent={mergedLocation.isActive() ? "danger" : "success"}
                      onClick={() => {
                        setFieldValue(
                          "status",
                          mergedLocation.isActive()
                            ? Location.STATUS.INACTIVE
                            : Location.STATUS.ACTIVE
                        )
                      }}
                    />
                  </Tooltip>
                }
              />
              <LocationField
                label="Location"
                value={
                  <GeoLocation
                    lat={mergedLocation.lat}
                    lng={mergedLocation.lng}
                  />
                }
                action={getClearButton(() => {
                  setFieldValue("lat", null)
                  setFieldValue("lng", null)
                })}
              />
              <Leaflet
                mapId="merged-location"
                markers={[
                  {
                    id: "marker-merged-location",
                    name: _escape(mergedLocation.name) || "", // escape HTML in location name!
                    lat: Location.hasCoordinates(mergedLocation)
                      ? mergedLocation.lat
                      : null,
                    lng: Location.hasCoordinates(mergedLocation)
                      ? mergedLocation.lng
                      : null
                  }
                ]}
              />
              <div className="merge-loc-fset">
                <ApprovalSteps
                  type={PLANNING_APPROVAL}
                  steps={mergedLocation.planningApprovalSteps}
                  fieldSetAction={getClearButton("planningApprovalSteps", [])}
                />
              </div>

              <div className="merge-loc-fset">
                <ApprovalSteps
                  type={PUBLICATION_APPROVAL}
                  steps={mergedLocation.approvalSteps}
                  fieldSetAction={getClearButton("approvalSteps", [])}
                />
              </div>
            </>
          )}
        </div>
        <LocationColumn
          location={location02}
          setLocation={setLocationFn02}
          setFieldValue={setFieldValue}
          style={{ flex: "0 0 33%" }}
          reversed
        />
      </div>
      <Button
        style={{ width: "98%", margin: "16px 1%" }}
        large
        intent="primary"
        text="Merge Locations"
        onClick={() => mergeLocation(location01, location02, mergedLocation)}
        disabled={!location01 || !location02 || !mergedLocation?.name}
      />
    </div>
  )

  function mergeLocation(location01, location02, mergedLocation) {
    console.log(location01)
    console.log(location02)
    console.log(mergedLocation)
  }

  function setFieldValue(field, value) {
    mergedLocation[field] = value
    setMergedLocation(new Location(mergedLocation))
  }

  function setAllFields(old) {
    const { name, status, lat, lng, approvalSteps, planningApprovalSteps } = old
    const nw = { name, status, lat, lng, approvalSteps, planningApprovalSteps }
    setMergedLocation(new Location(nw))
  }

  function getClearButton(field, value = null) {
    return (
      <Tooltip content="Clear field value" intent="danger">
        <Button
          icon="delete"
          outlined
          intent="danger"
          onClick={() => {
            if (typeof field === "string") {
              setFieldValue(field, value)
            } else if (typeof field === "function") {
              field()
            } else {
              throw new Error("Unexpected onClick handler!")
            }
          }}
        />
      </Tooltip>
    )
  }
}

MergeLocations.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MergeLocations)
