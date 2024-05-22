import {
  Icon,
  Intent,
  Popover,
  PopoverInteractionKind,
  Tooltip
} from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import styled from "@emotion/styled"
import * as FieldHelper from "components/FieldHelper"
import { Field } from "formik"
import {
  convertLatLngToMGRS,
  convertMGRSToLatLng,
  parseCoordinate
} from "geoUtils"
import { Location } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Form, Row, Table } from "react-bootstrap"
import utils from "utils"

export const GEO_LOCATION_DISPLAY_TYPE = {
  FORM_FIELD: "FORM_FIELD",
  GENERIC: "GENERIC"
}

const DEFAULT_COORDINATES = {
  lat: null,
  lng: null,
  displayedCoordinate: null
}

const GeoLocation = ({ labels, ...props }) => {
  const [locationFormat, setLocationFormat] = useState(Location.locationFormat)
  const label = labels[locationFormat]
  return (
    <BaseGeoLocation
      labels={labels}
      locationFormat={locationFormat}
      setLocationFormat={setLocationFormat}
      label={label}
      {...props}
    />
  )
}
GeoLocation.propTypes = {
  labels: PropTypes.object
}
GeoLocation.defaultProps = {
  labels: Location.LOCATION_FORMAT_LABELS
}

export const BaseGeoLocation = ({
  labels,
  locationFormat,
  setLocationFormat,
  label,
  name,
  coordinates,
  editable,
  setFieldValue,
  setFieldTouched,
  isSubmitting,
  displayType
}) => {
  const CoordinatesFormField =
    locationFormat === Location.LOCATION_FORMATS.MGRS
      ? MGRSFormField
      : LatLonFormField

  if (!editable) {
    const humanValue = (
      <ReadonlyGeoLocation>
        <CoordinatesFormField
          name={name}
          labels={labels}
          coordinates={coordinates}
        />
        <AllFormatsInfo
          name={name}
          coordinates={coordinates}
          setLocationFormat={setLocationFormat}
        />
      </ReadonlyGeoLocation>
    )

    if (displayType === GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD) {
      return (
        <Field
          name={name || "location"}
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
    <div id={`fg-${name || "geoLocation"}`}>
      <CoordinatesFormField
        name={name}
        labels={labels}
        coordinates={coordinates}
        editable
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        isSubmitting={isSubmitting}
        locationFormat={locationFormat}
        setLocationFormat={setLocationFormat}
      />
    </div>
  )
}

const ReadonlyGeoLocation = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  @media (max-width: 440px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

export const CoordinatesPropType = PropTypes.shape({
  // user can input string
  lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  displayedCoordinate: PropTypes.string
})

BaseGeoLocation.propTypes = {
  labels: PropTypes.object,
  locationFormat: PropTypes.oneOf(Object.keys(Location.LOCATION_FORMATS))
    .isRequired,
  setLocationFormat: PropTypes.func.isRequired,
  label: PropTypes.string,
  name: PropTypes.string,
  coordinates: CoordinatesPropType,
  editable: PropTypes.bool,
  setFieldValue: utils.fnRequiredWhen.bind(null, "editable"),
  setFieldTouched: utils.fnRequiredWhen.bind(null, "editable"),
  isSubmitting: PropTypes.bool,
  displayType: PropTypes.oneOf([
    GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD,
    GEO_LOCATION_DISPLAY_TYPE.GENERIC
  ])
}

BaseGeoLocation.defaultProps = {
  labels: Location.LOCATION_FORMAT_LABELS,
  coordinates: DEFAULT_COORDINATES,
  editable: false,
  isSubmitting: false,
  displayType: GEO_LOCATION_DISPLAY_TYPE.GENERIC
}

export default GeoLocation

function getQualifiedFieldName(name, fieldName) {
  return name ? `${name}.${fieldName}` : fieldName
}

/* =========================== MGRSFormField ================================ */

const MGRSFormField = ({
  name,
  coordinates,
  editable,
  setFieldValue,
  setFieldTouched,
  isSubmitting,
  labels,
  locationFormat,
  setLocationFormat
}) => {
  const { displayedCoordinate } = coordinates
  if (!editable) {
    return <span>{displayedCoordinate || "?"}</span>
  }

  return (
    <Row style={{ marginBottom: "1rem" }}>
      <Col sm={2} as={Form.Label} htmlFor="displayedCoordinate">
        {labels[locationFormat]}
      </Col>

      <Col sm={7}>
        <Row>
          <Col sm={4}>
            <Field
              name={getQualifiedFieldName(name, "displayedCoordinate")}
              component={FieldHelper.InputFieldNoLabel}
              onChange={e => updateCoordinatesOnChange(e.target.value)}
              onBlur={e => {
                updateCoordinatesOnBlur(e.target.value)
              }}
            />
          </Col>
          <CoordinateActionButtons
            name={name}
            coordinates={coordinates}
            isSubmitting={isSubmitting}
            disabled={!displayedCoordinate}
            onClear={() => {
              setFieldTouched(
                getQualifiedFieldName(name, "displayedCoordinate"),
                false,
                false
              )
              setFieldValue(
                getQualifiedFieldName(name, "displayedCoordinate"),
                null,
                false
              )
              setFieldValue(getQualifiedFieldName(name, "lat"), null, false)
              setFieldValue(getQualifiedFieldName(name, "lng"), null, false)
            }}
            setLocationFormat={setLocationFormat}
          />
        </Row>
      </Col>
    </Row>
  )
  // Lat-Lng fields are read only, no need to validate in onChange or onBlur
  function updateCoordinatesOnChange(val) {
    setFieldValue(getQualifiedFieldName(name, "displayedCoordinate"), val)
    const newLatLng = convertMGRSToLatLng(val)
    setFieldValue(getQualifiedFieldName(name, "lat"), newLatLng[0], false)
    setFieldValue(getQualifiedFieldName(name, "lng"), newLatLng[1], false)
  }
  function updateCoordinatesOnBlur(val) {
    setFieldTouched(getQualifiedFieldName(name, "displayedCoordinate"), true)
    const newLatLng = convertMGRSToLatLng(val)
    setFieldValue(getQualifiedFieldName(name, "lat"), newLatLng[0], false)
    setFieldValue(getQualifiedFieldName(name, "lng"), newLatLng[1], false)
  }
}

MGRSFormField.propTypes = {
  name: PropTypes.string,
  coordinates: CoordinatesPropType,
  editable: PropTypes.bool,
  setFieldValue: utils.fnRequiredWhen.bind(null, "editable"),
  setFieldTouched: utils.fnRequiredWhen.bind(null, "editable"),
  isSubmitting: PropTypes.bool,
  labels: PropTypes.object,
  locationFormat: PropTypes.string,
  setLocationFormat: PropTypes.func
}

MGRSFormField.defaultProps = {
  labels: Location.LOCATION_FORMAT_LABELS,
  coordinates: DEFAULT_COORDINATES,
  editable: false,
  isSubmitting: false
}

/* ========================= LatLonFormField ================================ */

const LatLonFormField = ({
  name,
  coordinates,
  editable,
  setFieldValue,
  setFieldTouched,
  isSubmitting,
  labels,
  locationFormat,
  setLocationFormat
}) => {
  const { lat, lng } = coordinates
  if (!editable) {
    return (
      <div>
        <span>{utils.isNumeric(lat) ? lat : "?"}</span>
        <span>,&nbsp;</span>
        <span>{utils.isNumeric(lng) ? lng : "?"}</span>
      </div>
    )
  }
  return (
    <Row style={{ marginBottom: "1rem" }}>
      <Col sm={2} as={Form.Label} htmlFor={getQualifiedFieldName(name, "lat")}>
        {labels[locationFormat]}
      </Col>

      <Col sm={7}>
        <Row>
          <Col sm={3} style={{ marginRight: "8px" }}>
            <Field
              name={getQualifiedFieldName(name, "lat")}
              component={FieldHelper.InputFieldNoLabel}
              onChange={e => setLatOnChange(e.target.value)}
              onBlur={e => {
                setParsedLatOnBlur(e.target.value)
              }}
            />
          </Col>
          <Col sm={3}>
            <Field
              name={getQualifiedFieldName(name, "lng")}
              component={FieldHelper.InputFieldNoLabel}
              onChange={e => setLngOnChange(e.target.value)}
              onBlur={e => {
                setParsedLngOnBlur(e.target.value)
              }}
            />
          </Col>
          <CoordinateActionButtons
            name={name}
            coordinates={coordinates}
            isSubmitting={isSubmitting}
            disabled={!utils.isNumeric(lat) && !utils.isNumeric(lng)}
            onClear={() => {
              // setting second param to false prevents validation since lat, lng can be null together
              setFieldTouched(getQualifiedFieldName(name, "lat"), false, false)
              setFieldTouched(getQualifiedFieldName(name, "lng"), false, false)
              setFieldValue(
                getQualifiedFieldName(name, "displayedCoordinate"),
                null
              )
              setFieldValue(getQualifiedFieldName(name, "lat"), null)
              setFieldValue(getQualifiedFieldName(name, "lng"), null)
            }}
            setLocationFormat={setLocationFormat}
          />
        </Row>
      </Col>
    </Row>
  )

  // Don't parse in onChange, it limits user
  // displayedCoordinate is in read-only field, no need to validate
  function setLatOnChange(val) {
    setFieldValue(getQualifiedFieldName(name, "lat"), val)
    setFieldValue(
      getQualifiedFieldName(name, "displayedCoordinate"),
      convertLatLngToMGRS(val, lng),
      false
    )
  }

  function setLngOnChange(val) {
    setFieldValue(getQualifiedFieldName(name, "lng"), val)
    setFieldValue(
      getQualifiedFieldName(name, "displayedCoordinate"),
      convertLatLngToMGRS(lat, val),
      false
    )
  }

  function setParsedLatOnBlur(val) {
    setFieldValue(
      getQualifiedFieldName(name, "displayedCoordinate"),
      convertLatLngToMGRS(val, lng),
      false
    )
    setFieldTouched(getQualifiedFieldName(name, "lat"), true)
    setFieldValue(getQualifiedFieldName(name, "lat"), parseCoordinate(val))
  }

  function setParsedLngOnBlur(val) {
    setFieldValue(
      getQualifiedFieldName(name, "displayedCoordinate"),
      convertLatLngToMGRS(lat, val),
      false
    )
    setFieldTouched(getQualifiedFieldName(name, "lng"), true)
    setFieldValue(getQualifiedFieldName(name, "lng"), parseCoordinate(val))
  }
}

LatLonFormField.propTypes = {
  name: PropTypes.string,
  coordinates: CoordinatesPropType,
  editable: PropTypes.bool,
  setFieldValue: utils.fnRequiredWhen.bind(null, "editable"),
  setFieldTouched: utils.fnRequiredWhen.bind(null, "editable"),
  isSubmitting: PropTypes.bool,
  labels: PropTypes.object,
  locationFormat: PropTypes.string,
  setLocationFormat: PropTypes.func
}

LatLonFormField.defaultProps = {
  labels: Location.LOCATION_FORMAT_LABELS,
  coordinates: DEFAULT_COORDINATES,
  editable: false,
  isSubmitting: false
}

/* ======================= CoordinateActionButtons ============================ */

const CoordinateActionButtons = ({
  name,
  coordinates,
  onClear,
  isSubmitting,
  disabled,
  setLocationFormat
}) => {
  return (
    <Col sm={3} style={{ padding: "0 8px" }}>
      <Tooltip content="Clear coordinates">
        <Button
          variant="outline-danger"
          onClick={onClear}
          disabled={isSubmitting || disabled}
        >
          <Icon icon={IconNames.DELETE} />
        </Button>
      </Tooltip>
      <AllFormatsInfo
        name={name}
        coordinates={coordinates}
        setLocationFormat={setLocationFormat}
        inForm
      />
    </Col>
  )
}

CoordinateActionButtons.propTypes = {
  name: PropTypes.string,
  coordinates: CoordinatesPropType,
  onClear: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  setLocationFormat: PropTypes.func.isRequired
}

CoordinateActionButtons.defaultProps = {
  coordinates: DEFAULT_COORDINATES,
  disabled: true
}

/* ======================= AllFormatsInfo ============================ */

const AllFormatsInfo = ({ name, coordinates, setLocationFormat, inForm }) => {
  const { lat, lng } = coordinates
  if (!inForm && (!utils.isNumeric(lat) || !utils.isNumeric(lng))) {
    return null
  }
  return (
    <Popover
      placement="right"
      interactionKind={PopoverInteractionKind.CLICK}
      usePortal={false}
      autoFocus={false}
      enforceFocus={false}
      content={
        <div style={{ padding: "8px" }}>
          <Table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th colSpan="2" className="text-center">
                  All coordinate formats (click to change format)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Button
                    name={name}
                    onClick={() =>
                      setLocationFormat(Location.LOCATION_FORMATS.LAT_LON)}
                    variant="outline-secondary"
                  >
                    {
                      Location.LOCATION_FORMAT_LABELS[
                        Location.LOCATION_FORMATS.LAT_LON
                      ]
                    }
                  </Button>
                </td>
                <td>
                  <LatLonFormField name={name} coordinates={coordinates} />
                </td>
              </tr>
              <tr>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Button
                    name={name}
                    onClick={() =>
                      setLocationFormat(Location.LOCATION_FORMATS.MGRS)}
                    variant="outline-secondary"
                  >
                    {
                      Location.LOCATION_FORMAT_LABELS[
                        Location.LOCATION_FORMATS.MGRS
                      ]
                    }
                  </Button>
                </td>
                <td>
                  <MGRSFormField name={name} coordinates={coordinates} />
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      }
    >
      <Tooltip content="Display all coordinate formats">
        <Button
          style={{ marginLeft: "8px" }}
          id="gloc-info-btn"
          variant={inForm ? "outline-primary" : "default"}
          data-testid="info-button"
        >
          <Icon
            intent={inForm ? Intent.NONE : Intent.PRIMARY}
            icon={IconNames.INFO_SIGN}
          />
        </Button>
      </Tooltip>
    </Popover>
  )
}

AllFormatsInfo.propTypes = {
  name: PropTypes.string,
  coordinates: CoordinatesPropType,
  setLocationFormat: PropTypes.func.isRequired,
  inForm: PropTypes.bool
}

AllFormatsInfo.defaultProps = {
  coordinates: DEFAULT_COORDINATES,
  inForm: false
}
