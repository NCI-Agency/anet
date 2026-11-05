import fs from "node:fs"
import { expect, test } from "@playwright/test"
import AdvancedSearch from "../pages/advancedSearch.page.js"
import CreateTask from "../pages/createNewTask.page.js"
import Home from "../pages/home.page.js"
import Onboard from "../pages/onboard.page.js"
import Page from "../pages/page.js"
import ShowReport from "../pages/report/showReport.page.js"
import ShowAllCommunities from "../pages/showAllCommunities.page.js"

const names = [
  "EF 1.1",
  "EF 2.1",
  "EF 2.2",
  "EF 5",
  "Key Advisors",
  "Key Interlocutors",
  "Unlimited exporters"
]
const table = values =>
  `<div id="communities"><fieldset><table><tbody>${values
    .map(name => `<tr><td><span>${name}</span></td><td>Other data</td></tr>`)
    .join("")}</tbody></table></fieldset></div>`

test("every page module exports a constructor bound to its injected page", async ({
  page
}) => {
  const directory = new URL("../pages/", import.meta.url)
  const files = fs
    .readdirSync(directory, { recursive: true })
    .filter(file => file.endsWith(".js"))
  for (const file of files) {
    const { default: PageObject } = await import(new URL(file, directory).href)
    expect(typeof PageObject, file).toBe("function")
    const first = new PageObject(page)
    const second = new PageObject(page)
    expect(first.page, file).toBe(page)
    expect(second, file).not.toBe(first)
  }
})

test("two page objects can be used simultaneously without a global page binding", async ({
  page,
  context
}) => {
  const otherPage = await context.newPage()
  const first = new Home(page)
  const second = new Home(otherPage)
  await page.setContent('<input id="searchBarInput" value="first">')
  await otherPage.setContent('<input id="searchBarInput" value="second">')
  await expect(await first.getSearchBar()).toHaveValue("first")
  await expect(await second.getSearchBar()).toHaveValue("second")
  await otherPage.close()
  await expect(await first.getSearchBar()).toHaveValue("first")
})

test("inherited getter callbacks keep their page-object receiver", async ({
  page
}) => {
  const onboard = new Onboard(page)
  await page.setContent('<div class="onboarding-new"><h1>Welcome</h1></div>')
  await onboard.waitForWelcomeMessage("Welcome")
})

test("community locators remain live and membership does not require row order", async ({
  page
}) => {
  const communities = new ShowAllCommunities(page)
  await page.setContent(table(names.slice(0, 1)))
  const count = expect(communities.communities).toHaveCount(names.length)
  await page.setContent(table([...names].reverse()))
  await count
  await expect
    .poll(() => communities.communityNames.allInnerTexts())
    .toEqual(expect.arrayContaining(names))
  await page.setContent(
    table(names.map(name => (name === "EF 5" ? "EF 5 details" : name)))
  )
  expect(await communities.communityNames.allInnerTexts()).not.toEqual(
    expect.arrayContaining(names)
  )
})

test("native keyboard operations preserve rich-text insertion and blur", async ({
  page
}) => {
  const task = new CreateTask(page)
  await page.setContent(
    '<div id="fg-description"><div class="editable" contenteditable="true">Existing:</div></div>'
  )
  const editor = await task.getDescriptionInput()
  await editor.focus()
  await page.keyboard.press("End")
  await task.fillTaskDescription("description")
  await expect(editor).toHaveText("Existing:description")
  await expect(editor).not.toBeFocused()
})

test("native key sequences delete only the requested text", async ({
  page
}) => {
  const object = new Page(page)
  await page.setContent('<input value="keepremove">')
  const input = page.locator("input")
  await input.focus()
  await object.deleteText("remove")
  await expect(input).toHaveValue("keep")
})

test("report navigation waits for the report URL", async ({ page }) => {
  const report = new ShowReport(page)
  await page.route("**/*", route =>
    route.fulfill({ body: "Report", contentType: "text/html" })
  )
  await page.goto("/")
  const ready = report.waitForReportUrl()
  await page.goto("/reports/11111111-2222-3333-4444-555555555555")
  await ready
})

test("selected dropdown filters expose the application's disabled-class contract", async ({
  page
}) => {
  const search = new AdvancedSearch(page)
  await page.setContent(
    '<div class="advanced-search"><div aria-labelledby="addFilterDropdown"><ul><a href="#" role="button" class="dropdown-item disabled">Status</a><a href="#" role="button" class="dropdown-item">Subscribed</a></ul></div></div>'
  )
  await expect(await search.getSearchFilter("Status")).toHaveClass(
    /\bdisabled\b/
  )
  await expect(await search.getSearchFilter("Subscribed")).not.toHaveClass(
    /\bdisabled\b/
  )
})
