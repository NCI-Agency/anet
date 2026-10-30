import { expect, test } from "@playwright/test"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"
import EditReportPageObject from "../pages/report/editReport.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"
import { getRichTextContent } from "./richTextUtils.js"

test.describe(() => {
  let page, MyReports, EditReport, ShowReport
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    MyReports = new MyReportsPageObject(page)
    EditReport = new EditReportPageObject(page)
    ShowReport = new ShowReportPageObject(page)
  })
  const RICH_TEXT_CONTENT = [
    {
      selector: "h1",
      content: "Heading 1"
    },
    {
      selector: "h2",
      content: "Heading 2"
    },
    {
      selector: "h3",
      content: "Heading 3"
    },
    {
      selector: "",
      content: "Handle text without tags."
    },
    {
      selector: "blockquote",
      content: "Blockquote"
    },
    {
      selector: "b",
      content: "Bold"
    },
    {
      selector: "i",
      content: "Italic"
    },
    {
      selector: "u",
      content: "Underline"
    },
    {
      selector: "strike",
      content: "Strike"
    },
    {
      selector: "strike b",
      content: "BoldStrike"
    },
    {
      selector: "i b",
      content: "BoldItalic"
    },
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
  test("When reports have rich text content", async () => {
    // Dependent cases are steps in one scenario using the built-in page fixture.
    const stepTimeout = test.info().timeout
    test.setTimeout(stepTimeout * 2)

    await test.step(
      "Show report page should display content with correct tags",
      async () => {
        await MyReports.open("arthur")
        await MyReports.selectReport(
          "Test report with rich text",
          REPORT_STATES.DRAFT
        )
        await (
          await ShowReport.getReportText()
        ).waitFor({
          state: "visible",
          timeout: 10000
        })
        for (const {
          selector,
          multipleElements,
          index,
          content
        } of RICH_TEXT_CONTENT) {
          await expect(
            await getRichTextContent(
              await ShowReport.getReportText(),
              selector,
              multipleElements,
              index
            )
          ).toContainText(content, {
            useInnerText: true
          })
        }
      },
      { timeout: stepTimeout }
    )
    await test.step(
      "Edit report page should display content with correct tags",
      async () => {
        await (await ShowReport.getEditReportButton()).click()
        for (const {
          selector,
          multipleElements,
          index,
          content
        } of RICH_TEXT_CONTENT) {
          await expect(
            await getRichTextContent(
              await EditReport.getReportText(),
              selector,
              multipleElements,
              index
            )
          ).toContainText(content, {
            useInnerText: true
          })
        }
      },
      { timeout: stepTimeout }
    )
  })
})
