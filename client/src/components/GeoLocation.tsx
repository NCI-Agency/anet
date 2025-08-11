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

interface GeoLocationProps {
  labels?: any
}

const GeoLocation = ({
  labels = Location.LOCATION_FORMAT_LABELS,
  ...props
}: GeoLocationProps) => {
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

export interface CoordinatesPropType {
  // user can input string
  lat?: string | number
  lng?: string | number
  displayedCoordinate?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type
const locationFormats: string[] = Object.keys(Location.LOCATION_FORMATS)
interface BaseGeoLocationProps {
  labels?: any
  locationFormat: (typeof locationFormats)[number]
  setLocationFormat: (...args: unknown[]) => unknown
  label?: string
  name?: string
  coordinates?: CoordinatesPropType
  editable?: boolean
  // FIXME: required when editable
  setFieldValue?: (...args: unknown[]) => unknown
  // FIXME: required when editable
  setFieldTouched?: (...args: unknown[]) => unknown
  isSubmitting?: boolean
  displayType?:
    | GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD
    | GEO_LOCATION_DISPLAY_TYPE.GENERIC
}

export const BaseGeoLocation = ({
  labels = Location.LOCATION_FORMAT_LABELS,
  locationFormat,
  setLocationFormat,
  label,
  name,
  coordinates = DEFAULT_COORDINATES,
  editable = false,
  setFieldValue,
  setFieldTouched,
  isSubmitting = false,
  displayType = GEO_LOCATION_DISPLAY_TYPE.GENERIC
}: BaseGeoLocationProps) => {
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

export default GeoLocation

function getQualifiedFieldName(name, fieldName) {
  return name ? `${name}.${fieldName}` : fieldName
}

interface MGRSFormFieldProps {
  name?: string
  coordinates?: CoordinatesPropType
  editable?: boolean
  // FIXME: required when editable
  setFieldValue?: (...args: unknown[]) => unknown
  // FIXME: required when editable
  setFieldTouched?: (...args: unknown[]) => unknown
  isSubmitting?: boolean
  labels?: any
  locationFormat?: string
  setLocationFormat?: (...args: unknown[]) => unknown
}

/* =========================== MGRSFormField ================================ */

const MGRSFormField = ({
  name,
  coordinates = DEFAULT_COORDINATES,
  editable = false,
  setFieldValue,
  setFieldTouched,
  isSubmitting = false,
  labels = Location.LOCATION_FORMAT_LABELS,
  locationFormat,
  setLocationFormat
}: MGRSFormFieldProps) => {
  const { displayedCoordinate } = coordinates
  if (!editable) {
    return <span>{displayedCoordinate || "?"}</span>
  }

  return (
    <Row style={{ marginBottom: "1rem" }}>
      <Col
        sm={2}
        as={Form.Label}
        htmlFor={getQualifiedFieldName(name, "displayedCoordinate")}
      >
        {labels[locationFormat]}
      </Col>

      <Col sm={7}>
        <Row>
          <Col sm={4}>
            <Field
              name={getQualifiedFieldName(name, "displayedCoordinate")}
              component={FieldHelper.InputFieldNoLabel}
              onChange={e => updateCoordinatesOnChange(e.target.value)}
              onBlur={e => updateCoordinatesOnBlur(e.target.value)}
            />
          </Col>
          <CoordinateActionButtons
            name={name}
            coordinates={coordinates}
            isSubmitting={isSubmitting}
            onClear={() => {
              setFieldTouched(
                getQualifiedFieldName(name, "displayedCoordinate"),
                false,
                false
              )
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

  function setCoordinatesOnChangeOrBlur(val) {
    setFieldValue(getQualifiedFieldName(name, "displayedCoordinate"), val)
    // lat/lng fields are read only, no need to validate
    const newLatLng = convertMGRSToLatLng(val)
    setFieldValue(
      getQualifiedFieldName(name, "lat"),
      newLatLng[0] ?? null,
      false
    )
    setFieldValue(
      getQualifiedFieldName(name, "lng"),
      newLatLng[1] ?? null,
      false
    )
  }

  function updateCoordinatesOnChange(val) {
    setCoordinatesOnChangeOrBlur(val)
  }

  function updateCoordinatesOnBlur(val) {
    setFieldTouched(getQualifiedFieldName(name, "displayedCoordinate"), true)
    setCoordinatesOnChangeOrBlur(val)
  }
}

interface LatLonFormFieldProps {
  name?: string
  coordinates?: CoordinatesPropType
  editable?: boolean
  // FIXME: required when editable
  setFieldValue?: (...args: unknown[]) => unknown
  // FIXME: required when editable
  setFieldTouched?: (...args: unknown[]) => unknown
  isSubmitting?: boolean
  labels?: any
  locationFormat?: string
  setLocationFormat?: (...args: unknown[]) => unknown
}

/* ========================= LatLonFormField ================================ */

const LatLonFormField = ({
  name,
  coordinates = DEFAULT_COORDINATES,
  editable = false,
  setFieldValue,
  setFieldTouched,
  isSubmitting = false,
  labels = Location.LOCATION_FORMAT_LABELS,
  locationFormat,
  setLocationFormat
}: LatLonFormFieldProps) => {
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
              onBlur={e => setParsedLatOnBlur(e.target.value)}
            />
          </Col>
          <Col sm={3}>
            <Field
              name={getQualifiedFieldName(name, "lng")}
              component={FieldHelper.InputFieldNoLabel}
              onChange={e => setLngOnChange(e.target.value)}
              onBlur={e => setParsedLngOnBlur(e.target.value)}
            />
          </Col>
          <CoordinateActionButtons
            name={name}
            coordinates={coordinates}
            isSubmitting={isSubmitting}
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

  function setLatLngOnChangeOrBlur(
    fieldName,
    fieldValue,
    newLat,
    newLng,
    parse = false
  ) {
    // Don't parse in onChange, it limits user
    setFieldValue(
      getQualifiedFieldName(name, fieldName),
      parse ? parseCoordinate(fieldValue) : fieldValue
    )
    // displayedCoordinate is read-only, no need to validate
    const newDisplayedCoordinate = convertLatLngToMGRS(newLat, newLng)
    setFieldValue(
      getQualifiedFieldName(name, "displayedCoordinate"),
      newDisplayedCoordinate,
      false
    )
  }

  function setLatOnChange(val) {
    setLatLngOnChangeOrBlur("lat", val, val, lng)
  }

  function setLngOnChange(val) {
    setLatLngOnChangeOrBlur("lng", val, lat, val)
  }

  function setParsedLatOnBlur(val) {
    setFieldTouched(getQualifiedFieldName(name, "lat"), true)
    setLatLngOnChangeOrBlur("lat", val, val, lng, true)
  }

  function setParsedLngOnBlur(val) {
    setFieldTouched(getQualifiedFieldName(name, "lng"), true)
    setLatLngOnChangeOrBlur("lng", val, lat, val, true)
  }
}

interface CoordinateActionButtonsProps {
  name?: string
  coordinates?: CoordinatesPropType
  onClear: (...args: unknown[]) => unknown
  isSubmitting: boolean
  setLocationFormat: (...args: unknown[]) => unknown
}

/* ======================= CoordinateActionButtons ============================ */

const CoordinateActionButtons = ({
  name,
  coordinates = DEFAULT_COORDINATES,
  onClear,
  isSubmitting,
  setLocationFormat
}: CoordinateActionButtonsProps) => {
  const { lat, lng, displayedCoordinate } = coordinates
  const disabled = lat == null && lng == null && !displayedCoordinate
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

interface AllFormatsInfoProps {
  name?: string
  coordinates?: CoordinatesPropType
  setLocationFormat: (...args: unknown[]) => unknown
  inForm?: boolean
}

/* ======================= AllFormatsInfo ============================ */

const AllFormatsInfo = ({
  name,
  coordinates = DEFAULT_COORDINATES,
  setLocationFormat,
  inForm = false
}: AllFormatsInfoProps) => {
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
                <th colSpan={2} className="text-center">
                  All coordinate formats (click to change format)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Button
                    name={`${name}.${Location.LOCATION_FORMATS.LAT_LON}`}
                    onClick={() =>
                      setLocationFormat(Location.LOCATION_FORMATS.LAT_LON)
                    }
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
                    name={`${name}.${Location.LOCATION_FORMATS.MGRS}`}
                    onClick={() =>
                      setLocationFormat(Location.LOCATION_FORMATS.MGRS)
                    }
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
