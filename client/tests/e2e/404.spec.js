import { test } from "./support.js"

test("Report 404", async ({ app }) => {
  const { assertElementText, $ } = app
  await app.login("/reports/555")
  await assertElementText(await $(".not-found-text"), "Report #555 not found.")
  await app.logout()
})
test("Organization 404", async ({ app }) => {
  const { assertElementText, $ } = app
  await app.login("/organizations/555")
  await assertElementText(
    await $(".not-found-text"),
    "Organization #555 not found."
  )
  await app.logout()
})
test("People 404", async ({ app }) => {
  const { assertElementText, $ } = app
  await app.login("/people/555")
  await assertElementText(await $(".not-found-text"), "User #555 not found.")
  await app.logout()
})
test("Tasks 404", async ({ app }) => {
  const { assertElementText, $ } = app
  await app.login("/tasks/555")
  await assertElementText(await $(".not-found-text"), "Task #555 not found.")
  await app.logout()
})
test("Positions 404", async ({ app }) => {
  const { assertElementText, $ } = app
  await app.login("/positions/555")
  await assertElementText(
    await $(".not-found-text"),
    "Position #555 not found."
  )
  await app.logout()
})
