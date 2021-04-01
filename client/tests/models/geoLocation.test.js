import "@testing-library/jest-dom/extend-expect"
import { fireEvent, render, screen } from "@testing-library/react"
import { Form, Formik } from "formik"
import React from "react"
import { convertLatLngToMGRS } from "../../src/geoUtils"
import GeoLocation from "../../src/pages/locations/GeoLocation"

const GeoLocationTest = () => {
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
    render(GeoLocationTest())
    // LAT_LON is default
    const latLngLabel = screen.getByText(/Latitude, Longitude/)
    expect(latLngLabel).toBeInTheDocument()
    const latLngInput = screen.getByLabelText(/Latitude, Longitude/)
    expect(latLngInput).toBeInTheDocument()
  })
  it("We should be able to see MGRS label and input field", () => {
    render(GeoLocationTest())
    const formatSelect = screen.getByRole("combobox")
    expect(formatSelect).toBeInTheDocument()
    fireEvent.change(formatSelect, {
      target: {
        value: "MGRS"
      }
    })
    const mgrsInput = screen.getByLabelText(/MGRS/)
    expect(mgrsInput).toBeInTheDocument()
  })
})
