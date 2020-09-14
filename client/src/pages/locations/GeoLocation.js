import {
  AnchorButton,
  Popover,
  PopoverInteractionKind,
  Position,
  Tooltip
} from "@blueprintjs/core"
import * as FieldHelper from "components/FieldHelper"
import { Field } from "formik"
import {
  convertLatLngToMGRS,
  convertMGRSToLatLng,
  parseCoordinate
} from "geoUtils"
import PropTypes from "prop-types"
import React from "react"
import { Col, ControlLabel, FormGroup, Table } from "react-bootstrap"
import Settings from "settings"

export const GEO_LOCATION_DISPLAY_TYPE = {
  FORM_FIELD: "FORM_FIELD",
  GENERIC: "GENERIC"
}

const MGRS_LABEL = "MGRS Coordinate"
const LAT_LON_LABEL = "Latitude, Longitude"

const GeoLocation = ({
  lat,
  lng,
  editable,
  setFieldValue,
  setFieldTouched,
  isSubmitting,
  displayType,
  locationFormat,
  values
}) => {
  let label = LAT_LON_LABEL
  let CoordinatesFormField = LatLonFormField
  if (locationFormat === "MGRS") {
    label = MGRS_LABEL
    CoordinatesFormField = MGRSFormField
  }

  if (!editable) {
    const humanValue = (
      <div style={{ display: "flex", alignItems: "center" }}>
        <CoordinatesFormField lat={lat} lng={lng} />
        <AllFormatsInfo lat={lat} lng={lng} />
      </div>
    )

    if (displayType === GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD) {
      return (
        <Field
          name="location"
          label={label}
          component={FieldHelper.ReadonlyField}
          humanValue={humanValue}
          style={{ paddingTop: "2px" }}
        />
      )
    }

    return humanValue
  }

  return (
    <CoordinatesFormField
      lat={lat}
      lng={lng}
      editable
      setFieldValue={setFieldValue}
      setFieldTouched={setFieldTouched}
      isSubmitting={isSubmitting}
      values={values}
    />
  )
}

function fnRequiredWhenEditable(props, propName, componentName) {
  if (props.editable === true && typeof props[propName] !== "function") {
    return new Error(
      `Invalid prop '${propName}' is supplied to ${componentName}. '${propName}' isRequired when ${componentName} is editable and '${propName}' must be a function!`
    )
  }
}

GeoLocation.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  editable: PropTypes.bool,
  setFieldValue: fnRequiredWhenEditable,
  setFieldTouched: fnRequiredWhenEditable,
  isSubmitting: PropTypes.bool,
  displayType: PropTypes.oneOf([
    GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD,
    GEO_LOCATION_DISPLAY_TYPE.GENERIC
  ]),
  locationFormat: PropTypes.string,
  values: PropTypes.object
}

GeoLocation.defaultProps = {
  lat: null,
  lng: null,
  editable: false,
  isSubmitting: false,
  displayType: GEO_LOCATION_DISPLAY_TYPE.GENERIC,
  locationFormat: Settings?.fields?.location?.format
}

export default GeoLocation

/* =========================== MGRSFormField ================================ */

const MGRSFormField = ({
  lat,
  lng,
  editable,
  setFieldValue,
  setFieldTouched,
  isSubmitting,
  values
}) => {
  if (!editable) {
    return <span>{convertLatLngToMGRS(lat, lng) || "?"}</span>
  }
  return (
    <FormGroup style={{ marginBottom: 0 }}>
      <Col sm={2} componentClass={ControlLabel} htmlFor="displayedCoordinate">
        {MGRS_LABEL}
      </Col>

      <Col sm={7}>
        <Col sm={4}>
          <Field
            name="displayedCoordinate"
            component={FieldHelper.InputFieldNoLabel}
            onBlur={e => {
              setFieldTouched("displayedCoordinate", true, false)
              const newLatLng = convertMGRSToLatLng(e.target.value)
              setFieldValue(
                "displayedCoordinate",
                // convertLatLngToMGRS(newLatLng[0], newLatLng[1])
                //   ? e.target.value
                //   : ""
                e.target.value
              )
              setFieldValue("lat", newLatLng[0], false)
              setFieldValue("lng", newLatLng[1], false)
            }}
          />
        </Col>
        <CoordinateActionButtons
          lat={lat}
          lng={lng}
          isSubmitting={isSubmitting}
          disabled={!values.displayedCoordinate}
          onClear={() => {
            setFieldValue("displayedCoordinate", null)
            setFieldValue("lat", null, false)
            setFieldValue("lng", null, false)
          }}
        />
      </Col>
    </FormGroup>
  )
}

MGRSFormField.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  editable: PropTypes.bool,
  setFieldValue: fnRequiredWhenEditable,
  setFieldTouched: fnRequiredWhenEditable,
  isSubmitting: PropTypes.bool,
  values: PropTypes.object
}

MGRSFormField.defaultProps = {
  lat: null,
  lng: null,
  editable: false,
  isSubmitting: false
}

/* ========================= LatLonFormField ================================ */

const LatLonFormField = ({
  lat,
  lng,
  editable,
  setFieldValue,
  setFieldTouched,
  isSubmitting
}) => {
  if (!editable) {
    const lt = parseCoordinate(lat)
    const ln = parseCoordinate(lng)
    return (
      <>
        <span>{lt || lt === 0 ? lt : "?"}</span>
        <span>,&nbsp;</span>
        <span>{ln || ln === 0 ? ln : "?"}</span>
      </>
    )
  }
  return (
    <FormGroup style={{ marginBottom: 0 }}>
      <Col sm={2} componentClass={ControlLabel} htmlFor="lat">
        {LAT_LON_LABEL}
      </Col>

      <Col sm={7}>
        <Col sm={3} style={{ marginRight: "8px" }}>
          <Field
            name="lat"
            component={FieldHelper.InputFieldNoLabel}
            onBlur={() => {
              setParsedLatLng(lat, lng)
            }}
          />
        </Col>
        <Col sm={3}>
          <Field
            name="lng"
            component={FieldHelper.InputFieldNoLabel}
            onBlur={() => {
              setParsedLatLng(lat, lng)
            }}
          />
        </Col>
        <CoordinateActionButtons
          lat={lat}
          lng={lng}
          isSubmitting={isSubmitting}
          disabled={!lat && lat !== 0 && !lng && lng !== 0}
          onClear={() => {
            // setting second param to false prevents validation since lat, lng can be null together
            setFieldTouched("lat", false, false)
            setFieldTouched("lng", false, false)
            setFieldValue("lat", null)
            setFieldValue("lng", null)
          }}
        />
      </Col>
    </FormGroup>
  )

  function setParsedLatLng(latVal, lngVal) {
    setFieldTouched("lat", true, false)
    setFieldTouched("lng", true, false)
    setFieldValue("lat", parseCoordinate(latVal))
    setFieldValue("lng", parseCoordinate(lngVal))
  }
}

LatLonFormField.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  editable: PropTypes.bool,
  setFieldValue: fnRequiredWhenEditable,
  setFieldTouched: fnRequiredWhenEditable,
  isSubmitting: PropTypes.bool
}

LatLonFormField.defaultProps = {
  lat: null,
  lng: null,
  editable: false,
  isSubmitting: false
}

/* ======================= CoordinateActionButtons ============================ */

const CoordinateActionButtons = ({
  lat,
  lng,
  onClear,
  isSubmitting,
  disabled
}) => {
  return (
    <Col sm={2} style={{ padding: "4px 8px" }}>
      <Tooltip content="Clear coordinates">
        <AnchorButton
          minimal
          icon="delete"
          outlined
          intent="danger"
          onClick={onClear}
          disabled={isSubmitting || disabled}
        />
      </Tooltip>
      <AllFormatsInfo lat={lat} lng={lng} inForm />
    </Col>
  )
}

CoordinateActionButtons.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClear: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  disabled: PropTypes.bool
}

CoordinateActionButtons.defaultProps = {
  lat: null,
  lng: null,
  disabled: true
}

/* ======================= AllFormatsInfo ============================ */

const AllFormatsInfo = ({ lat, lng, inForm }) => {
  if (!inForm && ((!lat && lat !== 0) || (!lng && lng !== 0))) {
    return null
  }
  return (
    <Popover
      content={
        <div style={{ padding: "8px" }}>
          <Table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th colSpan="2" className="text-center">
                  All Coordinate Formats
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ whiteSpace: "nowrap" }}>{LAT_LON_LABEL}</td>
                <td>
                  <LatLonFormField lat={lat} lng={lng} />
                </td>
              </tr>
              <tr>
                <td style={{ whiteSpace: "nowrap" }}>{MGRS_LABEL}</td>
                <td>
                  <MGRSFormField lat={lat} lng={lng} />
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      }
      target={
        <Tooltip content="Display all coordinate formats">
          <AnchorButton
            style={{ marginLeft: "8px" }}
            id="gloc-info-btn"
            minimal
            icon="info-sign"
            intent="primary"
            outlined={inForm}
          />
        </Tooltip>
      }
      position={Position.RIGHT}
      interactionKind={PopoverInteractionKind.CLICK_TARGET_ONLY}
      usePortal={false}
    />
  )
}

AllFormatsInfo.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  inForm: PropTypes.bool
}

AllFormatsInfo.defaultProps = {
  lat: null,
  lng: null,
  inForm: false
}
