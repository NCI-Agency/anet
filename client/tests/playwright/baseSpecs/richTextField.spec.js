import { expect, test } from "@playwright/test"
import MyReportsPageObject, { REPORT_STATES } from "../pages/myReports.page.js"
import EditReportPageObject from "../pages/report/editReport.page.js"
import ShowReportPageObject from "../pages/report/showReport.page.js"
import { getRichTextContent } from "./richTextUtils.js"

test.describe(() => {
  // These cases are ordered scenario steps and explicitly share one file-owned context.
  test.describe.configure({
    mode: "serial"
  })
  let context, page, MyReports, EditReport, ShowReport
  test.beforeAll(async ({ browser }, testInfo) => {
    context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      ignoreHTTPSErrors: true
    })
    page = await context.newPage()
    MyReports = new MyReportsPageObject(page)
    EditReport = new EditReportPageObject(page)
    ShowReport = new ShowReportPageObject(page)
  })
  test.afterAll(async () => {
    await context?.close()
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
  test.describe("When reports have rich text content", () => {
    test("Show report page should display content with correct tags", async () => {
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
    })
    test("Edit report page should display content with correct tags", async () => {
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
    })
  })
})
