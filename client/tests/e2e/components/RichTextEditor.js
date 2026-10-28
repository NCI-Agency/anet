export class RichTextEditor {
  constructor(page, selector) {
    this.page = page
    this.input = page.locator(selector)
  }

  async fill(text) {
    await this.input.fill(text)
    await this.input.blur()
    // RichTextEditor flushes pending serialization on blur.
  }
}
