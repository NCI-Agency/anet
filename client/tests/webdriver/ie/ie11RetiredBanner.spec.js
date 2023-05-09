import { expect } from "chai"
import Home from "../pages/home.page"

describe("ANET home page on IE 11", () => {
  it("should have the correct title", async() => {
    await Home.openWithoutWaiting() // no loading indicator appears
    expect(await browser.getTitle()).to.equal("ANET")
  })

  it("should have the IE not supported banner", async() => {
    expect(await Home.getIeBannerText()).to.equal(
      "Internet Explorer is not fully supported by ANET. Some features may not work. Please consider switching to a modern browser."
    )
  })

  it("should display banner text in one line when screen resolution is 1024x768", async() => {
    const size = await (await Home.getIeBanner()).getSize()
    expect(size.width).to.equal(1024)
    expect(size.height).to.equal(32)
  })
})
