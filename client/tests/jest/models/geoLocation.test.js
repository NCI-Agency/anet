import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Form, Formik } from "formik"
import React from "react"
import GeoLocation from "../../../src/components/GeoLocation"
import { convertLatLngToMGRS } from "../../../src/geoUtils"

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
    render(<GeoLocationTest />)
    // LAT_LON is default
    const latLngLabel = screen.getByText(/Latitude, Longitude/)
    expect(latLngLabel).toBeInTheDocument()
    const latLngInput = screen.getByLabelText(/Latitude, Longitude/)
    expect(latLngInput).toBeInTheDocument()
    cleanup()
  })
  it("We should be able to see MGRS label and input field", () => {
    render(<GeoLocationTest />)
    const infoButton = screen.getByTestId("info-button")
    expect(infoButton).toBeInTheDocument()
    act(() => {
      fireEvent.click(infoButton)
    })
    const mgrsButton = screen.getByRole("button", {
      name: "Military Grid Reference System (MGRS)"
    })
    expect(mgrsButton).toBeInTheDocument()
    act(() => {
      fireEvent.click(mgrsButton)
    })
    const mgrsLabel = screen.getByText(
      /Military Grid Reference System \(MGRS\)/
    )
    expect(mgrsLabel).toBeInTheDocument()
    const mrgsInput = screen.getByLabelText(
      /Military Grid Reference System \(MGRS\)/
    )
    expect(mrgsInput).toBeInTheDocument()
    cleanup()
  })
})
