import { expect, test } from "@playwright/test"
import {
  getLocationInventory,
  isLocationInventoryResponse
} from "../baseSpecs/searchFilters/locationInventory.js"
import LocationFilter from "../pages/searchFilters/locationFilter.page.js"

const location = (uuid, name, parents = []) => ({
  uuid,
  name,
  parentLocations: parents
})

test("location inventory deduplicates UUID references, not equal display names", () => {
  const parent = location("country", "Antarctica")
  const child = location("area", "Antarctica", [parent])
  const inventory = getLocationInventory([
    { ...parent, descendantLocations: [child] },
    child,
    { ...child, ascendantLocations: [parent] },
    location("root", "VTC")
  ])
  expect(inventory.collapsed).toEqual([
    { name: "Antarctica", level: 0, expanded: false },
    { name: "VTC", level: 0, expanded: null }
  ])
  expect(inventory.expanded).toEqual([
    { name: "Antarctica", level: 0, expanded: true },
    { name: "Antarctica", level: 1, expanded: null },
    { name: "VTC", level: 0, expanded: null }
  ])
})

test("location inventory retains one row for every multiple-parent path", () => {
  const first = location("first", "First")
  const second = location("second", "Second")
  const shared = location("shared", "Shared", [second, first])
  const leaf = location("leaf", "Leaf", [shared])
  expect(getLocationInventory([second, leaf, first, shared]).expanded).toEqual([
    { name: "First", level: 0, expanded: true },
    { name: "Shared", level: 1, expanded: true },
    { name: "Leaf", level: 2, expanded: null },
    { name: "Second", level: 0, expanded: true },
    { name: "Shared", level: 1, expanded: true },
    { name: "Leaf", level: 2, expanded: null }
  ])
})

test("location inventory includes related nodes absent from the top-level list", () => {
  const root = location("root", "Root")
  const child = location("child", "Child", [root])
  const leaf = location("leaf", "Leaf", [child])
  expect(
    getLocationInventory([{ ...root, descendantLocations: [child, leaf] }])
      .expanded
  ).toEqual([
    { name: "Root", level: 0, expanded: true },
    { name: "Child", level: 1, expanded: true },
    { name: "Leaf", level: 2, expanded: null }
  ])
})

test("location inventory retains deep descendants beyond the UI indentation cap", () => {
  const nodes = [location("0", "0")]
  for (let i = 1; i < 6; i++) {
    nodes.push(location(String(i), String(i), [nodes[i - 1]]))
  }
  expect(getLocationInventory(nodes).expanded).toEqual(
    nodes.map((node, i) => ({
      name: node.name,
      level: Math.min(i, 3),
      expanded: i === 5 ? null : true
    }))
  )
})

test("location inventory reflects creations and merges without count ranges", () => {
  const root = location("root", "Root")
  const winner = location("winner", "Winner", [root])
  const loser = location("loser", "Loser", [root])
  const extra = location("extra", "Extra")
  const before = getLocationInventory([root, winner, loser])
  const after = getLocationInventory([root, winner, extra])
  expect(before.collapsed).toHaveLength(1)
  expect(after.collapsed).toHaveLength(2)
  expect(after.expanded).toEqual([
    { name: "Extra", level: 0, expanded: null },
    { name: "Root", level: 0, expanded: true },
    { name: "Winner", level: 1, expanded: null }
  ])
})

test("location inventory rejects cyclic, conflicting or truncated input", () => {
  const first = location("first", "First")
  const second = location("second", "Second", [first])
  expect(() =>
    getLocationInventory([{ ...first, parentLocations: [second] }, second])
  ).toThrow(/cyclic/)
  expect(() =>
    getLocationInventory([
      location("root", "Root"),
      { ...first, parentLocations: [second, location("root", "Root")] },
      second
    ])
  ).toThrow(/Cycle/)
  expect(() =>
    getLocationInventory([first, { ...first, name: "Other" }])
  ).toThrow(/Conflicting names/)
  expect(() => getLocationInventory([{ uuid: "missing-name" }])).toThrow(
    /unnamed/
  )
  expect(() =>
    getLocationInventory(
      Array.from({ length: 301 }, (_, i) => location(String(i), String(i)))
    )
  ).toThrow(/300-root limit/)
})

test("inventory response observation excludes unrelated and filtered requests", () => {
  const body = {
    query:
      "query($query: LocationSearchQueryInput) { locationList(query: $query) { list { ascendantLocations { uuid } descendantLocations { uuid } } } }",
    variables: { query: { status: "ACTIVE", pageSize: 0 } }
  }
  const response = (
    data = body,
    url = "http://localhost/graphql",
    method = "POST"
  ) => ({
    url: () => url,
    request: () => ({ method: () => method, postDataJSON: () => data })
  })
  expect(isLocationInventoryResponse(response())).toBe(true)
  for (const query of [
    { status: "ACTIVE", pageSize: 10 },
    { status: "INACTIVE", pageSize: 0 },
    { status: "ACTIVE", pageSize: 0, text: "Mart*" }
  ]) {
    expect(
      isLocationInventoryResponse(response({ ...body, variables: { query } }))
    ).toBe(false)
  }
  expect(isLocationInventoryResponse(response(null))).toBe(false)
  expect(isLocationInventoryResponse(response({ query: "personList" }))).toBe(
    false
  )
  expect(
    isLocationInventoryResponse(response(body, "http://localhost/other"))
  ).toBe(false)
  expect(
    isLocationInventoryResponse(
      response(body, "http://localhost/graphql", "GET")
    )
  ).toBe(false)
})

test("location row presentation stays live and detects omissions, duplicates and wrong nesting", async ({
  page
}) => {
  const filter = new LocationFilter(page)
  const parent = location("root", "Root")
  const child = location("child", "Child", [parent])
  const expected = getLocationInventory([parent, child])
  const row = (name, padding, icon = "") =>
    `<tr><td></td><td class="locationName"><div style="padding-left: ${padding}px">${icon ? `<span class="bp6-icon-chevron-${icon}"></span>` : ""}<span>${name}</span></div></td></tr>`
  const render = async rows =>
    page.setContent(
      `<div id="locationUuid-popover"><table><tbody>${rows}</tbody></table></div>`
    )
  await render(row("Root", 0, "right"))
  expect(await filter.getLocationRowPresentation()).toEqual(expected.collapsed)
  const complete = row("Root", 0, "down") + row("Child", 46)
  await render(complete)
  expect(await filter.getLocationRowPresentation()).toEqual(expected.expanded)
  for (const incorrect of [
    row("Root", 0, "down"),
    complete + row("Child", 46),
    row("Root", 0, "down") + row("Other", 46),
    row("Root", 0, "down") + row("Root", 46),
    row("Root", 0, "down") + row("Child", 26),
    row("Root", 0, "right") + row("Child", 46)
  ]) {
    await render(incorrect)
    expect(await filter.getLocationRowPresentation()).not.toEqual(
      expected.expanded
    )
  }
})
