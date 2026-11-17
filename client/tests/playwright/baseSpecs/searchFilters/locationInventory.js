// Test oracle for the response actually consumed by the location popover.
// Deliberately independent of the application's tree/flattening utilities.
export function isLocationInventoryResponse(response) {
  const request = response.request()
  if (
    new URL(response.url()).pathname !== "/graphql" ||
    request.method() !== "POST"
  ) {
    return false
  }
  let body
  try {
    body = request.postDataJSON()
  } catch {
    // Unrelated non-JSON traffic must not abort the response wait.
    return false
  }
  const query = body?.variables?.query
  return Boolean(
    typeof body?.query === "string" &&
    /\blocationList\s*\(\s*query\s*:/.test(body.query) &&
    body.query.includes("ascendantLocations") &&
    body.query.includes("descendantLocations") &&
    query?.status === "ACTIVE" &&
    query.pageSize === 0 &&
    !query.text
  )
}

export function getLocationInventory(items) {
  const nodes = new Map()
  const seen = new WeakSet()
  const register = location => {
    if (!location?.uuid || typeof location.name !== "string") {
      throw new Error(
        "Location inventory contains an unnamed or unidentified node"
      )
    }
    if (!nodes.has(location.uuid)) {
      nodes.set(location.uuid, {
        name: location.name,
        parents: new Set(),
        children: new Set()
      })
    }
    const node = nodes.get(location.uuid)
    if (node.name !== location.name) {
      throw new Error(`Conflicting names for location ${location.uuid}`)
    }
    if (seen.has(location)) return
    seen.add(location)
    for (const parent of location.parentLocations ?? []) {
      register(parent)
      node.parents.add(parent.uuid)
      nodes.get(parent.uuid).children.add(location.uuid)
    }
    for (const related of [
      ...(location.ascendantLocations ?? []),
      ...(location.descendantLocations ?? [])
    ]) {
      register(related)
    }
  }
  items.forEach(register)

  const sort = uuids =>
    [...uuids].sort((a, b) =>
      nodes.get(a).name.localeCompare(nodes.get(b).name)
    )
  const roots = sort(
    [...nodes.keys()].filter(uuid => nodes.get(uuid).parents.size === 0)
  )
  // Ancestors outside the ACTIVE result list start expanded so matching
  // descendants are visible; matching ancestors themselves start collapsed.
  const matchingUuids = new Set(items.map(item => item.uuid))
  const initiallyExpanded = new Set(
    items.flatMap(item =>
      (item.ascendantLocations ?? [])
        .map(ancestor => ancestor.uuid)
        .filter(uuid => !matchingUuids.has(uuid))
    )
  )
  const initial = []
  const visited = new Set()
  const expanded = []
  const walk = (uuid, path, initiallyVisible) => {
    if (path.includes(uuid)) {
      throw new Error(`Cycle in location inventory at ${uuid}`)
    }
    visited.add(uuid)
    const node = nodes.get(uuid)
    const row = {
      name: node.name,
      // The UI caps indentation at three levels, not hierarchy traversal.
      level: Math.min(path.length, 3),
      expanded: node.children.size ? true : null
    }
    expanded.push(row)
    if (initiallyVisible) {
      initial.push({
        ...row,
        expanded: node.children.size ? initiallyExpanded.has(uuid) : null
      })
    }
    for (const child of sort(node.children)) {
      walk(
        child,
        [...path, uuid],
        initiallyVisible && initiallyExpanded.has(uuid)
      )
    }
  }
  roots.forEach(uuid => walk(uuid, [], true))
  if (visited.size !== nodes.size) {
    throw new Error("Location inventory contains a rootless cyclic component")
  }
  // Do not silently accept the overlay's 300-root truncation in this test.
  if (roots.length > 300) {
    throw new Error("Location inventory exceeds the popover's 300-root limit")
  }
  return {
    initial,
    expanded
  }
}
