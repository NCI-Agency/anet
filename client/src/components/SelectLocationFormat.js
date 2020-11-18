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
        setLocationFormat(e.target.value)
      }}
    >
      {Object.values(Location.LOCATION_FORMATS).map(format => (
        <option value={format} key={format}>
          {format}
        </option>
      ))}
    </LocationFormatSelector>
  )
}

SelectLocationFormat.propTypes = {
  locationFormat: PropTypes.string.isRequired,
  setLocationFormat: PropTypes.func.isRequired
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
