import { expect } from "chai"
import MyReports, { REPORT_STATES } from "../pages/myReports.page"
import EditReport from "../pages/report/editReport.page"
import ShowReport from "../pages/showReport.page"

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
  it("Show report page should display content with correct tags", () => {
    MyReports.open()
    MyReports.selectReport("Test report with rich text", REPORT_STATES.DRAFT)
    ShowReport.reportText.waitForDisplayed()
    RICH_TEXT_CONTENT.forEach(
      ({ selector, multipleElements, index, content }) => {
        expect(
          ShowReport.getReportTextContent(
            selector,
            multipleElements,
            index
          ).getText()
        ).to.contain(content)
      }
    )
  })
  it("Edit report page should display content with correct tags", () => {
    ShowReport.editReportButton.click()
    RICH_TEXT_CONTENT.forEach(
      ({ selector, multipleElements, index, content }) => {
        expect(
          EditReport.getReportTextContent(
            selector,
            multipleElements,
            index
          ).getText()
        ).to.contain(content)
      }
    )
  })
})
