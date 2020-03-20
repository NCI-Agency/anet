import React from "react"
import PropTypes from "prop-types"
import { Button } from "react-bootstrap"
import { Location } from "../../models"
import { Coordinate } from "./Show"

const GeoLocation = ({ lat, lng, isSubmitting, onClearLocation }) => {
  return (
    <>
      <Coordinate coord={lat} />, {" "}
      <Coordinate coord={lng} />
      {
        Location.hasCoordinates({ lat, lng }) &&
        <Button
          style={{ width: "auto", padding: "0 0 0 16px" }}
          bsStyle="link"
          bsSize="sm"
          onClick={onClearLocation}
          disabled={isSubmitting}
        >
          Clear Location
        </Button>
      }
    </>
  )
}

GeoLocation.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isSubmitting: PropTypes.bool.isRequired,
  onClearLocation: PropTypes.func.isRequired
}

export default GeoLocation
