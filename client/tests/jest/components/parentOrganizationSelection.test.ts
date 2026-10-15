import CreateOrganization from "../../webdriver/pages/createNewOrganization.page.js"

describe("Parent organization selection", () => {
  it.each(["Expected parent", "04614b0f-7e8e-4bf1-8bc5-13abaffeab8a"])(
    "waits for the intended parent when searching for %s",
    async searchText => {
      let displayedName = "Previous parent"
      const selectedNames = []
      const input = { click: jest.fn(), setValue: jest.fn() }
      const name = {
        isExisting: async () => true,
        getText: async () => displayedName
      }
      const radio = {
        isSelected: async () => false,
        click: async () => selectedNames.push(displayedName)
      }
      const table = {
        $: async selector => (selector.endsWith("span") ? name : radio)
      }
      const popover = { waitForExist: jest.fn() }
      const shortName = { click: jest.fn() }
      const browser = {
        waitUntil: async predicate => {
          expect(await predicate()).toBe(false)
          expect(selectedNames).toEqual([])
          displayedName = "Expected parent"
          expect(await predicate()).toBe(true)
        }
      }
      const originalBrowser = globalThis.browser
      globalThis.browser = browser
      jest
        .spyOn(CreateOrganization, "getParentOrganizationInput")
        .mockResolvedValue(input)
      jest
        .spyOn(CreateOrganization, "getParentOrganizationsTable")
        .mockResolvedValue(table)
      jest
        .spyOn(CreateOrganization, "getParentOrganizationSearchPopover")
        .mockResolvedValue(popover)
      jest
        .spyOn(CreateOrganization, "getShortNameInput")
        .mockResolvedValue(shortName)
      try {
        await CreateOrganization.selectParentOrganizationByText(
          searchText,
          "Expected parent"
        )
        expect(input.setValue).toHaveBeenCalledWith(searchText)
        expect(selectedNames).toEqual(["Expected parent"])
        expect(popover.waitForExist).toHaveBeenCalledWith({
          reverse: true,
          timeout: 3000
        })
      } finally {
        globalThis.browser = originalBrowser
        jest.restoreAllMocks()
      }
    }
  )
})
