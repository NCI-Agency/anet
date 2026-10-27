export class RichTextEditor {
  constructor(page, selector) {
    this.page = page
    this.input = page.locator(selector)
  }

  async fill(text) {
    await this.input.fill(text)
    await this.input.blur()
    // RichTextEditor serializes into form state with a 100 ms debounce.
    await this.page.waitForTimeout(150)
  }
}
