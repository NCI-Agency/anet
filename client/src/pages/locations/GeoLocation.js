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
import React, { useEffect, useState } from "react"
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
  setValues,
  setFieldTouched,
  isSubmitting,
  displayType
}) => {
  let label = LAT_LON_LABEL
  let CoordinatesFormField = LatLonFormField
  if (Settings?.fields?.location?.format === "MGRS") {
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
      setValues={setValues}
      setFieldTouched={setFieldTouched}
      isSubmitting={isSubmitting}
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
  setValues: fnRequiredWhenEditable,
  setFieldTouched: fnRequiredWhenEditable,
  isSubmitting: PropTypes.bool,
  displayType: PropTypes.oneOf([
    GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD,
    GEO_LOCATION_DISPLAY_TYPE.GENERIC
  ])
}

GeoLocation.defaultProps = {
  lat: null,
  lng: null,
  editable: false,
  isSubmitting: false,
  displayType: GEO_LOCATION_DISPLAY_TYPE.GENERIC
}

export default GeoLocation

/* =========================== MGRSFormField ================================ */

const MGRSFormField = ({
  lat,
  lng,
  editable,
  setValues,
  setFieldTouched,
  isSubmitting
}) => {
  const [mgrs, setMgrs] = useState("")

  useEffect(() => {
    if (!editable && lat === null && lng === null) {
      setMgrs("")
    } else {
      const mgrsValue = convertLatLngToMGRS(lat, lng)
      if (mgrsValue) {
        setMgrs(mgrsValue)
        if (editable) {
          setValues({ displayedCoordinate: mgrsValue, lat: lat, lng: lng })
        }
      }
    }
  }, [editable, lat, lng, setValues])

  if (!editable) {
    return <span>{mgrs || "?"}</span>
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
            value={mgrs}
            onChange={e => setMgrs(e.target.value)}
            onBlur={e => {
              const newLatLng = convertMGRSToLatLng(mgrs)
              setValues({
                displayedCoordinate: e.target.value,
                lat: newLatLng[0],
                lng: newLatLng[1]
              })
              setFieldTouched("displayedCoordinate", true, false)
            }}
          />
        </Col>
        <CoordinateActionButtons
          lat={lat}
          lng={lng}
          isSubmitting={isSubmitting}
          disabled={!mgrs}
          onClear={() => {
            setValues({ lat: null, lng: null, displayedCoordinate: null })
            setMgrs("")
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
  setValues: fnRequiredWhenEditable,
  setFieldTouched: fnRequiredWhenEditable,
  isSubmitting: PropTypes.bool
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
  setValues,
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
              setFieldTouched("lat", true, false)
              setFieldTouched("lng", true, false)
              setValues({
                lat: parseCoordinate(lat),
                lng: parseCoordinate(lng)
              })
            }}
          />
        </Col>
        <Col sm={3}>
          <Field
            name="lng"
            component={FieldHelper.InputFieldNoLabel}
            onBlur={() => {
              setFieldTouched("lat", true, false)
              setFieldTouched("lng", true, false)
              setValues({
                lat: parseCoordinate(lat),
                lng: parseCoordinate(lng)
              })
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
            setValues({ lat: null, lng: null })
          }}
        />
      </Col>
    </FormGroup>
  )
}

LatLonFormField.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  editable: PropTypes.bool,
  setValues: fnRequiredWhenEditable,
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
