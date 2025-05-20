import { gql } from "@apollo/client"
import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import GeoLocation from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import RichTextEditor from "components/RichTextEditor"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import { Location } from "models"
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
      digram
      trigram
      description
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    }
  }
`

interface LocationPreviewProps {
  className?: string
  uuid?: string
}

const LocationPreview = ({ className, uuid }: LocationPreviewProps) => {
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
        <div className="text-center">
          <EntityAvatarDisplay
            avatar={location.entityAvatar}
            defaultAvatar={Location.relatedObjectType}
          />
        </div>

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.location.type}
          value={Location.humanNameOfType(location.type)}
        />

        {Location.hasCoordinates(location) && (
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
        )}

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.location.status}
          value={Location.humanNameOfStatus(location.status)}
        />

        {location.type === Location.LOCATION_TYPES.COUNTRY && (
          <>
            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.location.digram}
              value={location.digram}
            />

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.location.trigram}
              value={location.trigram}
            />
          </>
        )}

        {location.description && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.location.description}
            value={<RichTextEditor readOnly value={location.description} />}
          />
        )}
      </div>

      {Location.hasCoordinates(location) && (
        <Leaflet markers={[marker]} mapId={`${uuid}`} />
      )}
    </div>
  )
}

export default LocationPreview
