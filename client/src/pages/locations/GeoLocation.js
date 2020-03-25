import React from "react"
import PropTypes from "prop-types"
import { Button } from "react-bootstrap"
import { Location } from "../../models"
import REMOVE_ICON from "../../resources/delete.png"
import { Coordinate } from "./Show"

const GeoLocation = ({ lat, lng, onClearLocation, isSubmitting }) => {
  return (
    <>
      <Coordinate coord={lat} />,&nbsp;
      <Coordinate coord={lng} />
      {
        Location.hasCoordinates({ lat, lng }) && onClearLocation &&
        <Button
          style={{ width: "auto", margin: "0 0 4px 16px", padding: "0" }}
          bsStyle="link"
          bsSize="sm"
          onClick={onClearLocation}
          disabled={isSubmitting}
        >
          <img src={REMOVE_ICON} height={14} alt="Clear Location" />
        </Button>
      }
    </>
  )
}

GeoLocation.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClearLocation: PropTypes.func,
  isSubmitting: PropTypes.bool
}

export default GeoLocation
