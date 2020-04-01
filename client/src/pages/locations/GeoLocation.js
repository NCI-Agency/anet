import React from "react"
import PropTypes from "prop-types"
import { Button, Col, ControlLabel, FormGroup } from "react-bootstrap"
import { Field } from "formik"
import { Location } from "../../models"
import REMOVE_ICON from "../../resources/delete.png"
import * as FieldHelper from "../../components/FieldHelper"

const GeoLocation = ({ lat, lng, setFieldTouched, setFieldValue, isSubmitting, readOnly }) => {
  const setTouched = touched => {
    setFieldTouched("lat", touched, false)
    setFieldTouched("lng", touched, false)
  }

  if (readOnly) {
    return (
      <Field
        name="location"
        label="Latitude, Longitude"
        component={FieldHelper.ReadonlyField}
        humanValue={
          <>
            <span>{Location.parseCoordinate(lat) || "?"}</span>
            <span>,&nbsp;</span>
            <span>{Location.parseCoordinate(lng) || "?"}</span>
          </>
        }
      />
    )
  }

  return (
    <FormGroup style={{ marginBottom: 0 }}>
      <Col sm={2} componentClass={ControlLabel} htmlFor="lat">
        Latitude, Longitude
      </Col>

      <Col sm={7}>
        <Col sm={3} style={{ marginRight: "8px" }}>
          <Field
            name="lat"
            component={FieldHelper.InputFieldNoLabel}
            onBlur={() => {
              setTouched(true)
              setFieldValue("lat", Location.parseCoordinate(lat))
            }}
          />
        </Col>
        <Col sm={3}>
          <Field
            name="lng"
            component={FieldHelper.InputFieldNoLabel}
            onBlur={() => {
              setTouched(true)
              setFieldValue("lng", Location.parseCoordinate(lng))
            }}
          />
        </Col>
        {
          (lat || lng) && setFieldValue &&
          <Col sm={1}>
            <Button
              style={{ width: "auto", margin: "8px 0 0 0", padding: "0" }}
              bsStyle="link"
              bsSize="sm"
              onClick={() => {
                setTouched(false)
                setFieldValue("lat", null)
                setFieldValue("lng", null)
              }}
              disabled={isSubmitting}
            >
              <img src={REMOVE_ICON} height={14} alt="Clear Location" />
            </Button>
          </Col>
        }
      </Col>
    </FormGroup>
  )
}

GeoLocation.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  setFieldTouched: PropTypes.func,
  setFieldValue: PropTypes.func,
  isSubmitting: PropTypes.bool,
  readOnly: PropTypes.bool
}

GeoLocation.defaultProps = {
  lat: null,
  lng: null,
  readOnly: true
}

export default GeoLocation
