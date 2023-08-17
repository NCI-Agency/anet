import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import GeoLocation from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import RichTextEditor from "components/RichTextEditor"
import { convertLatLngToMGRS } from "geoUtils"
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
      description
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
  const label = Location.LOCATION_FORMAT_LABELS[Location.locationFormat]

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
        <PreviewField
          label="Type"
          value={Location.humanNameOfType(location.type)}
        />

        <PreviewField
          label={label}
          value={
            <GeoLocation
              coordinates={{
                lat: location.lat,
                lng: location.lng,
                displayedCoordinate: convertLatLngToMGRS(
                  location.lat,
                  location.lng
                )
              }}
            />
          }
        />

        <PreviewField
          label="Status"
          value={Location.humanNameOfStatus(location.status)}
        />

        {location.description && (
          <PreviewField
            label="Description"
            value={<RichTextEditor readOnly value={location.description} />}
          />
        )}
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
