import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import Leaflet from "components/Leaflet"
import _escape from "lodash/escape"
import { Location } from "models"
import PropTypes from "prop-types"
import React from "react"

const GQL_GET_LOCATION = gql`
  query ($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
      lat
      lng
      status
      type
    }
  }
`

const LocationPreview = ({ className, uuid }) => {
  const { data, error } = API.useApiQuery(GQL_GET_LOCATION, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const location = new Location(data.location ? data.location : {})

  const marker = {
    id: location.uuid || 0,
    name: _escape(location.name) || "" // escape HTML in location name!
  }
  if (Location.hasCoordinates(location)) {
    Object.assign(marker, {
      lat: location.lat,
      lng: location.lng
    })
  }

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4>{`Location ${location.name}`}</h4>
      </div>
      <div className="preview-section">
        <PreviewField label="Name" value={location.name} />

        <PreviewField
          label="Status"
          value={Location.humanNameOfStatus(location.status)}
        />

        <PreviewField
          label="Type"
          value={Location.humanNameOfType(location.type)}
        />
      </div>

      <Leaflet markers={[marker]} mapId={`${uuid}`} />
    </div>
  )
}

LocationPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default LocationPreview
