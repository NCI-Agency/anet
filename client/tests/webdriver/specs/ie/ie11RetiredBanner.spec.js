import { expect } from "chai"
import Home from "../../pages/home.page"

describe("Anet home page on IE 11", () => {
  it("should have the correct title", () => {
    Home.open()
    expect(browser.getTitle()).to.equal("ANET")
  })

  it("should have the IE not supported banner", () => {
    Home.open()
    expect(Home.ie11BannerText).to.equal(
      "Internet Explorer is not fully supported by ANET. Some features may not work. Please consider switching to a modern browser."
    )
  })

  it("should display banner text in one line when screen resolution is 1024x768", () => {
    Home.open()
    browser.setWindowSize(1024, 768)
    const size = browser.$("#ieBanner").getSize()
    expect(size.width).to.equal(1008) // 16px vertical scrollbar
    expect(size.height).to.equal(32)
  })
})
