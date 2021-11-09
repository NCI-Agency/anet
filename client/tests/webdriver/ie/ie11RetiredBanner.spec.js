import { expect } from "chai"
import Home from "../pages/home.page"

describe("ANET home page on IE 11", () => {
  it("should have the correct title", () => {
    Home.openWithoutWaiting() // no loading indicator appears
    expect(browser.getTitle()).to.equal("ANET")
  })

  it("should have the IE not supported banner", () => {
    expect(Home.ieBannerText).to.equal(
      "Internet Explorer is not fully supported by ANET. Some features may not work. Please consider switching to a modern browser."
    )
  })

  it("should display banner text in one line when screen resolution is 1024x768", () => {
    const size = Home.ieBanner.getSize()
    expect(size.width).to.equal(1024)
    expect(size.height).to.equal(32)
  })
})
