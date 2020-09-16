import "@testing-library/jest-dom/extend-expect"
import { render, screen } from "@testing-library/react"
import { Form, Formik } from "formik"
import React from "react"
import { convertLatLngToMGRS } from "../../src/geoUtils"
import GeoLocation from "../../src/pages/locations/GeoLocation"

const GeoLocationTest = format => {
  return (
    <Formik>
      {() => {
        const coordinates = {
          displayedCoordinate: convertLatLngToMGRS(0, 0),
          lat: 0,
          lng: 0
        }
        return (
          <Form>
            <GeoLocation
              locationFormat={format}
              coordinates={coordinates}
              editable
              setFieldTouched={() => {}}
              setFieldValue={() => {}}
            />
          </Form>
        )
      }}
    </Formik>
  )
}

describe("In the location form", () => {
  it("We should be able to see Latitude, Longitude label and input field", () => {
    render(GeoLocationTest("LAT_LON"))
    const latLngLabel = screen.getByText(/Latitude, Longitude/)
    expect(latLngLabel).toBeInTheDocument()
    const latLngInput = screen.getByLabelText(/Latitude, Longitude/)
    expect(latLngInput).toBeInTheDocument()
  })
  it("We should be able to see MGRS label and input field", () => {
    render(GeoLocationTest("MGRS"))
    const mgrsLabel = screen.getByText(/MGRS/)
    expect(mgrsLabel).toBeInTheDocument()
    const mgrsInput = screen.getByLabelText(/MGRS/)
    expect(mgrsInput).toBeInTheDocument()
  })
})
