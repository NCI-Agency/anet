import {
  gqlAllLocationFields,
  gqlEntityAvatarFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import GeoLocation from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import { PreviewTitle } from "components/previews/PreviewTitle"
import RichTextEditor from "components/RichTextEditor"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import { Location } from "models"
import React, { useMemo } from "react"
import Settings from "settings"

const GQL_GET_LOCATION = gql`
  query ($uuid: String!) {
    location(uuid: $uuid) {
      ${gqlAllLocationFields}
      ${gqlEntityAvatarFields}
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
  const location = useMemo(
    () => new Location(data?.location ?? {}),
    [data?.location]
  )
  const markers = useMemo(() => {
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
    return [marker]
  }, [location])

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const label = Location.LOCATION_FORMAT_LABELS[Location.locationFormat]

  return (
    <div className={`${className} preview-content-scroll`}>
      <PreviewTitle
        title={`Location ${location.name}`}
        status={location.status}
      />
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
        <Leaflet markers={markers} mapId={`${uuid}`} />
      )}
    </div>
  )
}

export default LocationPreview
