import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/report/showReport.page"
import { getRichTextContent } from "./richTextUtils"

const RICH_TEXT_CONTENT = [
  { selector: "h1", content: "Heading 1" },
  { selector: "h2", content: "Heading 2" },
  { selector: "h3", content: "Heading 3" },
  { selector: "", content: "Handle text without tags." },
  { selector: "blockquote", content: "Blockquote" },
  { selector: "b", content: "Bold" },
  { selector: "i", content: "Italic" },
  { selector: "u", content: "Underline" },
  { selector: "strike", content: "Strike" },
  { selector: "strike b", content: "BoldStrike" },
  { selector: "i b", content: "BoldItalic" },
  {
    selector: "ol",
    multipleElements: "li",
    index: 0,
    content: "numbered list 1"
  },
  {
    selector: "ol",
    multipleElements: "li",
    index: 1,
    content: "numbered list 2"
  },
  {
    selector: "ul",
    multipleElements: "li",
    index: 0,
    content: "bulleted list 1"
  },
  {
    selector: "ul",
    multipleElements: "li",
    index: 1,
    content: "bulleted list 2"
  }
]

describe("When reports have rich text content", () => {
  it("Show report page should display content with correct tags", async() => {
    await MyReports.open("arthur")
    await MyReports.selectReport(
      "Test report with rich text",
      REPORT_STATES.DRAFT
    )
    await (await ShowReport.getReportText()).waitForDisplayed()
    for (const {
      selector,
      multipleElements,
      index,
      content
    } of RICH_TEXT_CONTENT) {
      expect(
        await (
          await getRichTextContent(
            await ShowReport.getReportText(),
            selector,
            multipleElements,
            index
          )
        ).getText()
      ).to.contain(content)
    }
  })
  it("Edit report page should display content with correct tags", async() => {
    await (await ShowReport.getEditReportButton()).click()
    for (const {
      selector,
      multipleElements,
      index,
      content
    } of RICH_TEXT_CONTENT) {
      expect(
        await (
          await getRichTextContent(
            await EditReport.getReportText(),
            selector,
            multipleElements,
            index
          )
        ).getText()
      ).to.contain(content)
    }
  })
})
