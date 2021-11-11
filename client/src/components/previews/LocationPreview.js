import { gql } from "@apollo/client"
import API from "api"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GeoLocation, { GEO_LOCATION_DISPLAY_TYPE } from "components/GeoLocation"
import Leaflet from "components/Leaflet"
import { Field, Form, Formik } from "formik"
import { convertLatLngToMGRS } from "geoUtils"
import _escape from "lodash/escape"
import { Location } from "models"
import PropTypes from "prop-types"
import React from "react"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
      lat
      lng
      status
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

  return (
    <Formik enableReinitialize initialValues={location}>
      {() => {
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
            <Form className="form-horizontal" method="post">
              <div className="preview-sticky-title">
                <h4>{`Location ${location.name}`}</h4>
              </div>
              <Fieldset>
                <Field name="name" component={FieldHelper.ReadonlyField} />

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Location.humanNameOfStatus}
                />

                <GeoLocation
                  coordinates={{
                    lat: location.lat,
                    lng: location.lng,
                    displayedCoordinate: convertLatLngToMGRS(
                      location.lat,
                      location.lng
                    )
                  }}
                  displayType={GEO_LOCATION_DISPLAY_TYPE.FORM_FIELD}
                />
              </Fieldset>

              <Leaflet markers={[marker]} mapId={`${uuid}`} />
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

LocationPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default LocationPreview
