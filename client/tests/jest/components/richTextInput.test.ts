import Page from "../../webdriver/pages/page.js"

describe("Rich-text input replacement", () => {
  it.each([
    ["linux", "Control"],
    ["mac", "Meta"]
  ])(
    "replaces all paragraphs on %s after selection settles",
    async (platformName, modifier) => {
      let text = "Old first paragraph\nOld second paragraph\n"
      let selected = false
      let attempts = 0
      let persisted
      const editor = {
        click: jest.fn(),
        getText: async () => text
      }
      const browser = {
        capabilities: { platformName },
        keys: jest.fn(async key => {
          if (Array.isArray(key)) {
            expect(key).toEqual([modifier, "a"])
            // Simulate Slate still synchronizing the initial click's selection.
            selected = ++attempts > 1
          } else if (key === "Backspace") {
            if (selected) text = ""
          } else if (key === "Tab") {
            persisted = text
          } else {
            text += key
          }
        }),
        waitUntil: async predicate => {
          expect(await predicate()).toBe(false)
          expect(await predicate()).toBe(true)
        }
      }
      const originalBrowser = globalThis.browser
      globalThis.browser = browser
      try {
        await new Page().fillRichTextInput(
          { $: async () => editor },
          ".editable",
          "Replacement",
          "Old first paragraph"
        )
        expect(persisted).toBe("Replacement")
      } finally {
        globalThis.browser = originalBrowser
      }
    }
  )
})
