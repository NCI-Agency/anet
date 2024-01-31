import { gql } from "@apollo/client"
import API from "api"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import GeoLocation from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import RichTextEditor from "components/RichTextEditor"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import { Location } from "models"
import PropTypes from "prop-types"
import React from "react"
import Settings from "settings"

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
        <h4 className="ellipsized-text">{`Location ${location.name}`}</h4>
      </div>
      <div className="preview-section">
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.location.type}
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

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.location.status}
          value={Location.humanNameOfStatus(location.status)}
        />

        {location.description && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.location.description}
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
