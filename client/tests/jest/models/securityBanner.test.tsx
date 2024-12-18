import { render, screen } from "@testing-library/react"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import AppContext from "../../../src/components/AppContext"
import SecurityBanner from "../../../src/components/SecurityBanner"

const Wrapper = connection => {
  const currentUser = {}
  currentUser.name = "unit_test"
  currentUser.uuid = "unit_test_uuid"

  return (
    <BrowserRouter>
      <AppContext.Provider value={{ connection, currentUser }}>
        <SecurityBanner />
      </AppContext.Provider>
    </BrowserRouter>
  )
}

describe("In the security banner", () => {
  it("We should be able to see connection error message when there is an error", () => {
    render(Wrapper({ error: true, newVersion: null }))
    const errorMsg = screen.getByText(/Connection to the server/)
    expect(errorMsg).toBeInTheDocument()
  })
  it("We should be able to see new version message when there is a new version", () => {
    render(Wrapper({ error: false, newVersion: "UNIT_TEST_VERSION" }))
    const versionMsg = screen.getByText(/There is a new version of ANET/)
    expect(versionMsg).toBeInTheDocument()
  })
  it("We should be able to see normal banner text when no error and no new version", () => {
    render(Wrapper({ error: false, newVersion: null }))
    const normalBanner = screen.getByText(/DEMO USE ONLY/)
    expect(normalBanner).toBeInTheDocument()

    // Other notifications should dissappear
    const errorMsg = screen.queryByText(/Connection to the server/)
    expect(errorMsg).toBeNull()
    const versionMsg = screen.queryByText(/There is a new version of ANET/)
    expect(versionMsg).toBeNull()
  })
})
