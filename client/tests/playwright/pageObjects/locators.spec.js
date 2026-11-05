import fs from "node:fs"
import { expect, test } from "@playwright/test"
import ShowAttachment from "../pages/attachment/showAttachment.page.js"
import CreateAuthorizationGroup from "../pages/createAuthorizationGroup.page.js"
import CreateReport from "../pages/createReport.page.js"
import Home from "../pages/home.page.js"
import CreateLocation from "../pages/location/createNewLocation.page.js"
import EditLocation from "../pages/location/editLocation.page.js"
import MergeEventSeries from "../pages/mergeEventSeries.page.js"
import MergeLocations from "../pages/mergeLocations.page.js"
import MergeOrganizations from "../pages/mergeOrganizations.page.js"
import MergePeople from "../pages/mergePeople.page.js"
import MergePositions from "../pages/mergePositions.page.js"
import MergeTasks from "../pages/mergeTasks.page.js"
import MyCounterparts from "../pages/myCounterparts.page.js"
import MyTasks from "../pages/myTasks.page.js"
import Page from "../pages/page.js"
import ReportForm from "../pages/report/createReport.page.js"
import ShowReport from "../pages/report/showReport.page.js"
import Search from "../pages/search.page.js"
import ShowPerson from "../pages/showPerson.page.js"

const escapeHtml = value =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
const name = 'CIV O\'Brien "Advisor"'

// DOM fixtures mirror the relevant application components, not the old XPath depth.
test("menu locators select actual roles and retain notification badges and URLs", async ({
  page
}) => {
  const home = new Home(page)
  const person = new ShowPerson(page)
  await page.setContent(`<a id="my-work" role="button">My Work</a>
    <a href="/tasks/mine"><span>My Objectives<span class="badge">3</span></span></a>
    <a href="/positions/counterparts"><span>My Counterparts<span class="badge">2</span></span></a>
    <a href="/organizations/example"><span>My Organization<br><small>Example</small></span></a>
    <a role="button">Default</a><a role="button">Exclude sensitive fields</a>`)
  await expect(await home.getLinksMenuButton()).toHaveAttribute(
    "role",
    "button"
  )
  await expect(await home.getMyTasksLink()).toHaveAttribute(
    "href",
    "/tasks/mine"
  )
  await expect(await home.getMyCounterpartsNotifications()).toHaveText("2")
  await expect(await home.getMyOrgLink()).toHaveAttribute(
    "href",
    "/organizations/example"
  )
  await expect(await person.getDefaultPreset()).toHaveAttribute(
    "role",
    "button"
  )
  await expect(await person.getWithoutSensitivePreset()).toHaveAttribute(
    "role",
    "button"
  )
})

for (const count of [0, 1, 12, 144]) {
  test(`home approval tile includes count ${count} in its accessible name`, async ({
    page
  }) => {
    const home = new Home(page)
    const content = value => `<button>Reports pending my approval</button>
      <fieldset class="home-tile-row"><legend>My ANET snapshot</legend>
        <button class="home-tile"><h1>9</h1>My reports pending approval</button>
        <button class="home-tile"><h1>9</h1>Reports pending my approval extra</button>
        <button class="home-tile" data-target="approval" onclick="this.dataset.clicked = 'true'"><h1>${value}</h1>Reports pending my approval</button>
      </fieldset>`
    await page.setContent(content(count))
    const tile = await home.getReportsPendingMyApproval()
    const counter = await home.getReportsPendingMyApprovalCount()
    await expect(tile).toHaveAttribute("data-target", "approval")
    await expect(counter).toHaveText(String(count))
    await tile.click()
    await expect(tile).toHaveAttribute("data-clicked", "true")
    await page.setContent(content(count + 1))
    await expect(counter).toHaveText(String(count + 1))
    await expect(tile).toHaveAttribute("data-target", "approval")
  })
}

for (const PageObject of [Page, CreateAuthorizationGroup]) {
  for (const withAvatar of [false, true]) {
    test(`${PageObject.name} matches exact related-object text ${withAvatar ? "with" : "without"} avatars`, async ({
      page
    }) => {
      const community = new PageObject(page)
      const avatar = withAvatar ? '<span><img alt="Avatar"></span>' : ""
      await page.setContent(`<table class="related_objects_table"><tbody>
        <tr><td><span><strong><a href="/people/other">${avatar}${escapeHtml(name)} extra</a></strong></span></td><td><button>Remove other</button></td></tr>
        <tr><td><span><strong><em><a href="/people/advisor">${avatar}${escapeHtml(name)}</a></em></strong></span></td><td><button>Remove advisor</button></td></tr>
        <tr><td><a href="/positions/admin">${avatar}ANET Administrator</a></td><td><button>Remove administrator</button></td></tr>
        </tbody></table>`)
      const link = await community.getRelatedObjectsTableEntry(name)
      await expect(link).toHaveAttribute("href", "/people/advisor")
      await expect(
        (await community.getRelatedObjectsTableRow(name)).getByRole("button")
      ).toHaveText("Remove advisor")
      await expect(
        await community.getRelatedObjectsTableEntry("ANET Administrator")
      ).toHaveAttribute("href", "/positions/admin")
    })
  }
}

// LinkTo includes avatar alternative text in the accessible name. Match the
// exact visible entity label instead, without broadening to prefix matches.
for (const [PageObject, method, container, label, args] of [
  [
    CreateAuthorizationGroup,
    "getAdministrativePositionsTableEntry",
    "positions_table",
    "EF 2.2 Final Reviewer"
  ],
  [
    CreateAuthorizationGroup,
    "getAuthorizationGroupLink",
    "my-authorization-groups",
    name
  ],
  [
    MyCounterparts,
    "getMyPendingCounterpart",
    "my-counterparts-with-pending-assessments",
    name
  ],
  [MyCounterparts, "getMyCounterpart", "my-counterparts", name],
  [MyTasks, "getMyPendingTask", "my-tasks-with-pending-assessments", name],
  [
    CreateReport,
    "getAttendeeAssessment",
    "attendees-engagement-assessments",
    name
  ],
  [CreateReport, "getTaskAssessment", "tasks-engagement-assessments", name],
  [
    ShowReport,
    "getAttendeeAssessment",
    "attendees-engagement-assessments",
    name,
    ["attendees-engagement-assessments", name]
  ],
  [
    ShowReport,
    "getTaskEngagementAssessment",
    "tasks-engagement-assessments",
    name,
    ["tasks-engagement-assessments", name]
  ],
  [ShowAttachment, "getOwner", null, "CIV Arthur Dmin", []],
  [ShowAttachment, "getUsedin", null, "A test report from Arthur", []]
]) {
  for (const withAvatar of [false, true]) {
    test(`${PageObject.name}.${method} matches exact entity labels ${withAvatar ? "with" : "without"} avatars`, async ({
      page
    }) => {
      const object = new PageObject(page)
      const avatar = withAvatar ? '<span><img alt="Avatar"></span>' : ""
      const link = (href, text) =>
        `<a href="${href}"><img alt="">${avatar}${escapeHtml(text)}</a>`
      // The out-of-scope exact match and in-scope prefix match must not win.
      const outside = container ? link("/outside", label) : ""
      const isPositionsTable = container === "positions_table"
      const attribute = isPositionsTable
        ? ""
        : `id="${container ?? "attachment-details"}"`
      const tableAttribute = isPositionsTable ? 'class="positions_table"' : ""
      await page.setContent(`${outside}<div ${attribute}><span>${escapeHtml(label)}</span><fieldset><table ${tableAttribute}><tbody>
        <tr><td>${link("/prefix", label + " extra")}</td></tr>
        <tr><td><strong>${link("/target", label)}</strong></td><td>${link("/occupant", "Other occupant")}</td><td><button>Remove position</button></td></tr>
        </tbody></table></fieldset></div>`)
      const entry = await object[method](...(args ?? [label]))
      await expect(entry).toHaveAttribute("href", "/target")
      // Keep the returned locator live when the link destination changes.
      await page
        .locator('a[href="/target"]')
        .evaluate(element => element.setAttribute("href", "/updated"))
      await expect(entry).toHaveAttribute("href", "/updated")
    })
  }
}

for (const [PageObject, method, id, args] of [
  [
    CreateReport,
    "getAttendeeAssessmentLabel",
    "attendees-engagement-assessments",
    [name, 2]
  ],
  [
    CreateReport,
    "getTaskAssessmentLabel",
    "tasks-engagement-assessments",
    [name, 2]
  ],
  [
    ShowReport,
    "getAttendeeAssessmentLabel",
    "attendees-engagement-assessments",
    ["attendees-engagement-assessments", name, 2]
  ],
  [
    ShowReport,
    "getTaskEngagementAssessmentLabel",
    "tasks-engagement-assessments",
    ["tasks-engagement-assessments", name, 2]
  ]
]) {
  test(`${PageObject.name}.${method} follows the correct header and stays live`, async ({
    page
  }) => {
    const object = new PageObject(page)
    const content = value => `<div id="${id}"><table><tbody>
      <tr><th><a href="/other">Other</a></th></tr><tr><td>Other label</td></tr>
      <tr><th><span><em><strong><a href="/advisor"><span><img alt="Avatar"></span>${escapeHtml(name)}</a></strong></em></span></th></tr>
      <tr><td>First label</td></tr><tr><td>${value}</td></tr>
      </tbody></table></div>`
    await page.setContent(content("Second label"))
    const label = await object[method](...args)
    await expect(label).toHaveText("Second label")
    await page.setContent(content("Updated label"))
    await expect(label).toHaveText("Updated label")
  })
}

for (const [PageObject, column] of [
  [MergePeople, "merge-per-col"],
  [MergePositions, "merge-pos-col"],
  [MergeLocations, "merge-loc-col"],
  [MergeOrganizations, "merge-org-col"],
  [MergeTasks, "merge-task-col"],
  [MergeEventSeries, "merge-eventSeries-col"]
]) {
  for (const nested of [false, true]) {
    test(`${PageObject.name} scopes values and selection buttons in ${nested ? "nested" : "flat"} columns`, async ({
      page
    }) => {
      const merge = new PageObject(page)
      const content = value =>
        ["left", "right"]
          .map(side => {
            const fields = `<div><div><div>Other field</div><div>${escapeHtml(name)}</div></div><small><button>Other</button></small></div>
            <div><div><div>Name extra</div><div>Wrong name</div></div></div>
            <div><div><div>Name</div><div>${side} ${value}</div></div><small><button>${side} name select</button></small></div>
            <div><div><div>${escapeHtml(name)}</div><div>${side} value<small><button>Value info</button></small><div><a role="button">Zoom in</a></div></div></div><small><button onclick="this.dataset.clicked = 'true'">${side} select</button></small></div>`
            // Merge columns wrap MergeField boxes in a component div/fieldset.
            return `<div id="${side}-${column}">${nested ? `<div><label>Selected entity</label><fieldset>${fields}</fieldset></div>` : fields}</div>`
          })
          .join("")
      await page.setContent(content("Kabul Hospital"))
      await expect(await merge.getColumnContent("right", name)).toContainText(
        "right value"
      )
      for (const side of ["left", "right"]) {
        const select = await merge.getSelectButton(side, name)
        await expect(select).toHaveText(`${side} select`)
        await select.click()
        await expect(select).toHaveAttribute("data-clicked", "true")
      }
      const locationName = await merge.getColumnContent("left", "Name")
      await expect(locationName).toHaveText("left Kabul Hospital")
      await expect(await merge.getSelectButton("right", "Name")).toHaveText(
        "right name select"
      )
      await page.setContent(content("updated location"))
      await expect(locationName).toHaveText("left updated location")
    })
  }
}

for (const side of ["left", "right"]) {
  test(`location merge selects ${side} coordinates rather than embedded info or map controls`, async ({
    page
  }) => {
    const merge = new MergeLocations(page)
    const label = "Latitude, Longitude"
    const coordinates = {
      left: "38.58809, -28.71611",
      right: "34.5553, 69.2075"
    }
    const content = () => `<div id="mid-merge-loc-col"><div><fieldset>
      <div><div><div>${label}</div><div id="merged-coordinates">?, ?</div></div></div>
      </fieldset></div></div>${["left", "right"]
        .map(
          columnSide => `<div id="${columnSide}-merge-loc-col"><div><fieldset>
        <div><div><div>${label} extra</div><div>Wrong coordinates</div></div><small><button>Wrong select</button></small></div>
        <div><div><div>${label}</div><div><div><span>${coordinates[columnSide]}</span><span><button data-testid="info-button" onclick="this.dataset.clicked = 'true'">Info</button></span></div>
          <div class="leaflet-container"><a role="button">Zoom in</a><button>Clear search</button></div>
          <small><button>Nested value action</button></small>
        </div></div><small><button onclick="document.getElementById('merged-coordinates').textContent = '${coordinates[columnSide]}'">Select ${columnSide}</button></small></div>
        </fieldset></div></div>`
        )
        .join("")}`
    await page.setContent(content())
    const selectedValue = await merge.getColumnContent("mid", label)
    const select = await merge.getSelectButton(side, label)
    await expect(select).toHaveText(`Select ${side}`)
    await select.click()
    await merge.waitForColumnToStartWith(coordinates[side], "mid", label)
    await expect(selectedValue).toHaveText(coordinates[side])
    await expect(
      page.locator('[data-testid="info-button"][data-clicked]')
    ).toHaveCount(0)
    await page.setContent(content())
    await expect(selectedValue).toHaveText("?, ?")
    await select.click()
    await expect(selectedValue).toHaveText(coordinates[side])
  })
}

for (const PageObject of [CreateLocation, EditLocation]) {
  test(`${PageObject.name} scopes coordinate values to their format rows`, async ({
    page
  }) => {
    const location = new PageObject(page)
    await page.setContent(`<form class="form-horizontal"><div class="bp6-popover-content"><table><tbody>
      <tr><td><button>Latitude / Longitude</button></td><td><span>52</span><span>, </span><span>4</span></td></tr>
      <tr><td><button>MGRS</button></td><td><span>31U</span></td></tr>
      </tbody></table></div></form>`)
    await expect(await location.getAllFormatsPopoverLat()).toHaveText("52")
    await expect(await location.getAllFormatsPopoverLng()).toHaveText("4")
    await expect(await location.getAllFormatsPopoverMGRS()).toHaveText("31U")
  })
}

for (const withAvatar of [false, true]) {
  for (const nested of [false, true]) {
    for (const showDelete of [false, true]) {
      test(`attendee rows match quoted names ${withAvatar ? "with" : "without"} avatars in ${nested ? "nested" : "flat"} tables ${showDelete ? "with" : "without"} removal controls`, async ({
        page
      }) => {
        const form = new ReportForm(page)
        const avatar = withAvatar ? '<span><img alt="Avatar"></span>' : ""
        const content = position => {
          const rows = `<tr><td class="primary-attendee"></td><td class="conflictButton"><span>Other conflict</span></td>
            <td class="reportPeopleName"><a href="/other">Other</a></td><td><a href="/wrong-column">${avatar}${escapeHtml(name)}</a></td><td>Other location</td><td>Other organization</td></tr>
            <tr><td class="primary-attendee"><input name="reportInterlocutorADVISOR"><input name="reportInterlocutorINTERLOCUTOR"></td>
            <td class="conflictButton"><span>Conflict</span></td><td class="reportPeopleName"><a href="/advisor">${avatar}${escapeHtml(name)}</a></td>
            <td>${position}</td><td>Murray's Hotel</td><td>EF 2.2</td>${showDelete ? '<td class="deleteReportPeople"><button>Remove person</button></td>' : ""}</tr>`
          // ReportPeople renders attendee tables inside category rows. Those
          // enclosing rows also contain the target link, but are not attendees.
          const table = `<table class="advisorAttendeesTable"><tbody>${rows}</tbody></table>`
          return `<div id="reportPeopleContainer">${nested ? `<table><tbody><tr><th>Advisors</th><td><div>${table}</div></td></tr><tr><th>Interlocutors</th><td><table class="interlocutorAttendeesTable"><tbody><tr><td class="reportPeopleName">Different category</td></tr></tbody></table></td></tr></tbody></table>` : table}</div>`
        }
        await page.setContent(content("EF 2.2 Advisor D"))
        const columns = await form.getAttendeeColumns(name)
        expect(columns).toHaveLength(showDelete ? 7 : 6)
        await expect(columns[2]).toHaveText(name)
        await expect(columns[3]).toHaveText("EF 2.2 Advisor D")
        await expect(columns[4]).toHaveText("Murray's Hotel")
        await expect(columns[5]).toHaveText("EF 2.2")
        const person = await form.getPersonByName(name)
        expect(person.name).toBe(name)
        await expect(person.conflictButton).toHaveText("Conflict")
        await expect(person.advisorCheckbox).toHaveAttribute(
          "name",
          "reportInterlocutorADVISOR"
        )
        await expect(person.interlocutorCheckbox).toHaveAttribute(
          "name",
          "reportInterlocutorINTERLOCUTOR"
        )
        const report = new ShowReport(page)
        const attendee = await report.getAttendeeByName(name)
        expect(attendee.name).toBe(name)
        await expect(attendee.conflictButton).toHaveText("Conflict")
        expect(await report.getAttendeeByName("Missing attendee")).toBeNull()
        await page.setContent(content("EF 2.1 Advisor B"))
        await expect(columns[3]).toHaveText("EF 2.1 Advisor B")
      })
    }
  }
}

// SimpleMultiCheckboxDropdown renders its decorative caret in the accessible name.
for (const caret of ["", ' <span class="ms-1 small">▾</span>']) {
  for (const entity of ["person", "report"]) {
    test(`${entity} optional fields dropdown accepts ${caret ? "the rendered caret" : "a plain label"} without matching other buttons`, async ({
      page
    }) => {
      const content = checked => `<button>Other Optional Fields ▾</button>
        <button>Optional Fields extra ▾</button>
        <button>Optional Fields ▾ extra</button>
        <div class="position-relative d-inline-block">
          <button class="d-inline-flex align-items-center" data-target="optional-fields"
            onclick="document.getElementById('optionalFields-menu').style.display = 'block'">Optional Fields${caret}</button>
          <div id="optionalFields-menu" role="menu" style="display:none">
            <label for="email"><span>Email address</span><input type="checkbox" id="email" ${checked ? "checked" : ""}></label>
            <button>Select All</button><button>Clear All</button>
          </div>
        </div>`
      await page.setContent(content(false))
      if (entity === "person") {
        const person = new ShowPerson(page)
        const button = await person.getOptionalFieldsButton()
        await expect(button).toHaveAttribute("data-target", "optional-fields")
        await button.click()
        await expect(page.getByRole("menu")).toBeVisible()
        await page.getByRole("checkbox", { name: "Email address" }).check()
        await expect(page.getByRole("checkbox")).toBeChecked()
        await page.setContent(content(true))
        await button.click()
        await expect(page.getByRole("menu")).toBeVisible()
      } else {
        const report = new ShowReport(page)
        await report.selectOptionalField("email")
        await expect(page.getByRole("checkbox")).toBeChecked()
        await page.setContent(content(true))
        await report.selectOptionalField("email")
        await expect(page.getByRole("checkbox")).toBeChecked()
      }
    })
  }
}

// CompactRow renders a th next to a td in tbody: Chromium exposes a rowheader.
for (const nested of [false, true]) {
  test(`person compact field waits use exact row headers in ${nested ? "nested" : "flat"} print tables`, async ({
    page
  }) => {
    const person = new ShowPerson(page)
    const fields = ["Primary Position", "Date of birth"]
    const content = visible => {
      const rows = fields
        .map(
          field =>
            `<tr style="display:${visible ? "table-row" : "none"}"><th>${field}</th><td>Value</td></tr>`
        )
        .join("")
      const table = `<table><tbody><tr><th>Primary Position extra</th><td>Other</td></tr>${rows}</tbody></table>`
      return `<table><tbody><tr><th>Primary Position</th><td>Outside compact view</td></tr></tbody></table>
        <div class="compact-view">${nested ? `<table><thead><tr><th>Other column</th></tr></thead><tbody><tr><td>${table}</td></tr></tbody></table>` : table}</div>`
    }
    await page.setContent(content(true))
    await expect(
      page
        .locator(".compact-view")
        .getByRole("rowheader", { name: fields[0], exact: true })
    ).toHaveCount(1)
    await person.waitForCompactField(false, ...fields)
    await page.setContent(content(false))
    await person.waitForCompactField(true, ...fields)
    await page.setContent(content(true))
    await person.waitForCompactField(false, ...fields)
    await page
      .locator(".compact-view")
      .evaluate(element => element.replaceChildren())
    await person.waitForCompactField(true, ...fields)
  })

  test(`report compact field values belong to the row's own label in ${nested ? "nested" : "flat"} print tables`, async ({
    page
  }) => {
    const report = new ShowReport(page)
    const content = value => {
      const table = `<table><tbody><tr><th>Title extra</th><td>Other</td></tr>
        <tr><th>Other field</th><td>Title</td></tr>
        <tr><th>Title</th><td>${value}</td></tr></tbody></table>`
      return `<table><tbody><tr><th>Title</th><td>Outside compact view</td></tr></tbody></table>
        <div class="compact-view">${nested ? `<table><tbody><tr><th>Layout</th><td>Wrong layout value</td><td>${table}</td></tr></tbody></table>` : table}</div>`
    }
    await page.setContent(content("Target title"))
    expect(await report.getCompactFieldValue("Title")).toBe("Target title")
    await page.setContent(content("Updated title"))
    expect(await report.getCompactFieldValue("Title")).toBe("Updated title")
  })
}

test("attachment cards and compact fields use scoped container filters", async ({
  page
}) => {
  const person = new ShowPerson(page)
  const report = new ShowReport(page)
  await page.setContent(`<div class="attachment-card"><a href="/attachments/other/edit">Other</a></div>
    <div class="attachment-card"><section><a href="/attachments/example/edit">Target</a></section></div>
    <div class="compact-view"><table><tbody><tr><th>Title extra</th><td>Other</td></tr>
    <tr><th>Title</th><td>Target title</td></tr></tbody></table></div>`)
  await expect(await person.getAttachmentCardByUuid("example")).toHaveText(
    "Target"
  )
  expect(await person.attachmentCardExistsByUuid("missing")).toBe(false)
  expect(await report.getCompactFieldValue("Title")).toBe("Target title")
})

test("search links preserve substring matching within the result table body", async ({
  page
}) => {
  const search = new Search(page)
  await page.setContent(`<div id="people"><div id="people-search-results"><table><thead><tr><th><a href="/header">${escapeHtml(name)}</a></th></tr></thead>
    <tbody><tr><td><a href="/advisor">${escapeHtml(name)} (Advisor)</a></td></tr></tbody></table></div></div>`)
  await expect(await search.linkOfPersonFound(name)).toHaveAttribute(
    "href",
    "/advisor"
  )
})

test("page objects and scenario specs do not reintroduce XPath selectors", async () => {
  for (const folder of [
    "pages",
    "baseSpecs",
    "customFieldsSpecs",
    "noCustomFieldsSpecs"
  ]) {
    const directory = new URL(`../${folder}/`, import.meta.url)
    for (const file of fs
      .readdirSync(directory, { recursive: true })
      .filter(file => file.endsWith(".js"))) {
      const source = fs.readFileSync(new URL(file, directory), "utf8")
      expect(source, `${folder}/${file}`).not.toMatch(
        /xpath=|["'`]\/\/|\.locator\(\s*["']\.\.["']\s*\)/
      )
    }
  }
})
