import styled from "@emotion/styled"
import { Location } from "models"
import PropTypes from "prop-types"
import React from "react"

const SelectLocationFormat = ({ locationFormat, setLocationFormat }) => {
  return (
    <LocationFormatSelector
      value={locationFormat}
      name="locationFormat"
      id="locationFormat"
      onChange={e => {
        Location.setLocationFormat(e.target.value)
        setLocationFormat(e.target.value)
      }}
    >
      <option value={Location.LOCATION_FORMATS.LAT_LON}>
        {Location.LOCATION_FORMATS.LAT_LON}
      </option>
      <option value={Location.LOCATION_FORMATS.MGRS}>
        {Location.LOCATION_FORMATS.MGRS}
      </option>
    </LocationFormatSelector>
  )
}

SelectLocationFormat.propTypes = {
  locationFormat: PropTypes.string,
  setLocationFormat: PropTypes.func
}

const LocationFormatSelector = styled.select`
  margin-left: 10px;
  outline: 2px solid #337ab7;
  font-size: 14px;
  margin-left: 1rem;
  & > option {
    font-size: 1.4rem;
    font-weight: bold;
  }
`

export default SelectLocationFormat
