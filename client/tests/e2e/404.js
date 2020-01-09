const test = require("../util/test")

test("Report 404", async t => {
  t.plan(1)

  const { assertElementText, $ } = t.context

  await t.context.get("/reports/555")
  await assertElementText(
    t,
    await $(".not-found-text"),
    "Report #555 not found."
  )
})

test("Organization 404", async t => {
  t.plan(1)

  const { assertElementText, $ } = t.context

  await t.context.get("/organizations/555")
  await assertElementText(
    t,
    await $(".not-found-text"),
    "Organization #555 not found."
  )
})

test("People 404", async t => {
  t.plan(1)

  const { assertElementText, $ } = t.context

  await t.context.get("/people/555")
  await assertElementText(t, await $(".not-found-text"), "User #555 not found.")
})

test("Tasks 404", async t => {
  t.plan(1)

  const { assertElementText, $ } = t.context

  await t.context.get("/tasks/555")
  await assertElementText(t, await $(".not-found-text"), "Task #555 not found.")
})

test("Positions 404", async t => {
  t.plan(1)

  const { assertElementText, $ } = t.context

  await t.context.get("/positions/555")
  await assertElementText(
    t,
    await $(".not-found-text"),
    "Position #555 not found."
  )
})
