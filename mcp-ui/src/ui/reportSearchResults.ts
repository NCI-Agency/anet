import { sendAction } from "../messaging"

type ReportItem = {
  uuid: string
  intent?: string
  engagementDate?: string | number
  advisorOrgShortName?: string
  interlocutorOrgShortName?: string
  matchedBy?: string[]
}

type ParsedQuery = {
  text?: string
  personNames?: string[]
  locationNames?: string[]
  orgNames?: string[]
  engagementDateStart?: string
  engagementDateEnd?: string
}

type ResultsArgs = {
  query?: string
  searchKeyword?: string
  parsed?: ParsedQuery
  matchedPersons?: string[]
  matchedLocations?: string[]
  matchedOrgs?: string[]
  reports: ReportItem[]
  totalCount?: number
}

type ResultsUI = {
  render: (args: unknown) => void
}

type ResultsElements = {
  root: HTMLElement
  card: HTMLElement
  header: HTMLElement
  refineBtn: HTMLButtonElement
  subheader: HTMLElement
  listEl: HTMLElement
  emptyEl: HTMLElement
  statusEl: HTMLElement
  showMoreWrap: HTMLElement
  showMoreBtn: HTMLButtonElement
}

function buildUI(
  root: HTMLElement,
  onRefine: () => void,
  onShowMore: () => void
): ResultsElements {
  const card = document.createElement("div")
  card.className = "card"
  card.id = "mcp-ui-report-search-results"

  const headerRow = document.createElement("div")
  headerRow.className = "results-header-row"

  const header = document.createElement("div")
  header.className = "label"

  const refineBtn = document.createElement("button")
  refineBtn.type = "button"
  refineBtn.className = "refine-btn"
  refineBtn.textContent = "Refine search"
  refineBtn.addEventListener("click", onRefine)

  headerRow.append(header, refineBtn)

  const subheader = document.createElement("div")
  subheader.className = "filter-chips-row"
  subheader.style.display = "none"

  const list = document.createElement("div")
  list.className = "results-list"

  const empty = document.createElement("div")
  empty.className = "description"
  empty.textContent = "No reports matched your query."
  empty.style.display = "none"

  const status = document.createElement("div")
  status.className = "status"

  const showMoreWrap = document.createElement("div")
  showMoreWrap.className = "show-more-wrap"
  showMoreWrap.style.display = "none"
  const showMoreBtn = document.createElement("button")
  showMoreBtn.type = "button"
  showMoreBtn.className = "show-more-btn"
  showMoreBtn.textContent = "Show more"
  showMoreBtn.addEventListener("click", onShowMore)
  showMoreWrap.append(showMoreBtn)

  card.append(headerRow, subheader, list, empty, showMoreWrap, status)
  root.replaceChildren(card)

  return {
    root,
    card,
    header,
    refineBtn,
    subheader,
    listEl: list,
    emptyEl: empty,
    statusEl: status,
    showMoreWrap,
    showMoreBtn
  }
}

function formatDate(raw: unknown): string | null {
  if (raw == null) return null
  if (typeof raw === "string") {
    // ISO 8601 — first 10 chars are YYYY-MM-DD.
    if (raw.length >= 10) return raw.slice(0, 10)
    return raw || null
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Milliseconds since epoch.
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return null
}

function formatMeta(report: ReportItem): string {
  const parts: string[] = []
  const date = formatDate(report.engagementDate)
  if (date) parts.push(date)
  const advisor = report.advisorOrgShortName?.trim()
  const interlocutor = report.interlocutorOrgShortName?.trim()
  if (advisor || interlocutor) {
    parts.push(`${advisor || "?"} → ${interlocutor || "?"}`)
  }
  return parts.join(" · ")
}

function postOpenReport(uuid: string) {
  sendAction("open_report", { uuid })
}

function normalizeStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const cleaned = v
    .filter((x): x is string => typeof x === "string")
    .map(x => x.trim())
    .filter(x => x.length > 0)
  return cleaned.length > 0 ? cleaned : undefined
}

function normalizeParsed(v: unknown): ParsedQuery | undefined {
  if (!v || typeof v !== "object") return undefined
  const r = v as Record<string, unknown>
  const out: ParsedQuery = {}
  if (typeof r.text === "string" && r.text.trim()) out.text = r.text.trim()
  const personNames = normalizeStringArray(r.personNames)
  if (personNames) out.personNames = personNames
  const locationNames = normalizeStringArray(r.locationNames)
  if (locationNames) out.locationNames = locationNames
  const orgNames = normalizeStringArray(r.orgNames)
  if (orgNames) out.orgNames = orgNames
  if (typeof r.engagementDateStart === "string" && r.engagementDateStart.trim()) {
    out.engagementDateStart = r.engagementDateStart.trim().slice(0, 10)
  }
  if (typeof r.engagementDateEnd === "string" && r.engagementDateEnd.trim()) {
    out.engagementDateEnd = r.engagementDateEnd.trim().slice(0, 10)
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function normalizeArgs(args: unknown): ResultsArgs {
  if (!args || typeof args !== "object") return { reports: [] }
  const r = args as Record<string, unknown>
  const reports = Array.isArray(r.reports)
    ? r.reports
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map(x => {
          const advisor = (x.advisorOrg ?? null) as Record<string, unknown> | null
          const interlocutor = (x.interlocutorOrg ?? null) as Record<string, unknown> | null
          const matchedByRaw = Array.isArray(x.matchedBy) ? x.matchedBy : []
          const matchedBy = matchedByRaw.filter(
            (s): s is string => typeof s === "string" && s.trim().length > 0
          )
          return {
            uuid: typeof x.uuid === "string" ? x.uuid : "",
            intent: typeof x.intent === "string" ? x.intent : undefined,
            engagementDate:
              typeof x.engagementDate === "string" ||
              typeof x.engagementDate === "number"
                ? x.engagementDate
                : undefined,
            advisorOrgShortName:
              advisor && typeof advisor.shortName === "string"
                ? advisor.shortName
                : undefined,
            interlocutorOrgShortName:
              interlocutor && typeof interlocutor.shortName === "string"
                ? interlocutor.shortName
                : undefined,
            matchedBy: matchedBy.length > 0 ? matchedBy : undefined
          }
        })
        .filter(x => x.uuid.length > 0)
    : []

  return {
    query: typeof r.query === "string" ? r.query : undefined,
    searchKeyword:
      typeof r.searchKeyword === "string" ? r.searchKeyword : undefined,
    parsed: normalizeParsed(r.parsed),
    matchedPersons: normalizeStringArray(r.matchedPersons),
    matchedLocations: normalizeStringArray(r.matchedLocations),
    matchedOrgs: normalizeStringArray(r.matchedOrgs),
    reports,
    totalCount: typeof r.totalCount === "number" ? r.totalCount : undefined
  }
}

type FilterChip = {
  kind: "text" | "person" | "location" | "org" | "date"
  label: string
}

function formatDateRange(
  start: string | undefined,
  end: string | undefined
): string | undefined {
  if (start && end) {
    if (start === end) return `date: ${start}`
    return `date: ${start} to ${end}`
  }
  if (start) return `date: ≥ ${start}`
  if (end) return `date: ≤ ${end}`
  return undefined
}

function buildFilterChips(
  parsed: ParsedQuery | undefined,
  fallback: string | undefined,
  matched: {
    persons?: string[]
    locations?: string[]
    orgs?: string[]
  }
): FilterChip[] {
  if (parsed) {
    const chips: FilterChip[] = []
    if (parsed.text) chips.push({ kind: "text", label: `text: ${parsed.text}` })

    const onlyOnePerson =
      !parsed.text &&
      (parsed.personNames?.length ?? 0) === 1 &&
      !parsed.locationNames?.length &&
      !parsed.orgNames?.length &&
      !parsed.engagementDateStart &&
      !parsed.engagementDateEnd
    const personLabels =
      matched.persons && matched.persons.length > 0
        ? matched.persons
        : (parsed.personNames ?? []).map(name =>
            onlyOnePerson && fallback && fallback.toLowerCase() !== name.toLowerCase()
              ? fallback
              : name
          )
    for (const label of personLabels) {
      chips.push({ kind: "person", label: `person: ${label}` })
    }

    const locationLabels =
      matched.locations && matched.locations.length > 0
        ? matched.locations
        : parsed.locationNames ?? []
    for (const label of locationLabels) {
      chips.push({ kind: "location", label: `location: ${label}` })
    }

    const orgLabels =
      matched.orgs && matched.orgs.length > 0
        ? matched.orgs
        : parsed.orgNames ?? []
    for (const label of orgLabels) {
      chips.push({ kind: "org", label: `org: ${label}` })
    }
    const dateLabel = formatDateRange(
      parsed.engagementDateStart,
      parsed.engagementDateEnd
    )
    if (dateLabel) chips.push({ kind: "date", label: dateLabel })
    return chips
  }
  return fallback ? [{ kind: "text", label: `text: ${fallback}` }] : []
}

export type RefineFn = (previousQuery: string) => void
export type ShowMoreFn = (query: string, nextLimit: number) => void

const INITIAL_LIMIT = 10
const SHOW_MORE_BATCH = 10

export function createReportSearchResultsUI(
  root: HTMLElement,
  onRefine?: RefineFn,
  onShowMore?: ShowMoreFn
): ResultsUI {
  let elements: ResultsElements | null = null
  let currentQuery: string = ""
  let currentLimit: number = INITIAL_LIMIT
  const renderedUuids = new Set<string>()

  function ensureElements() {
    if (!elements) {
      elements = buildUI(
        root,
        () => {
          if (onRefine) onRefine(currentQuery)
        },
        () => {
          if (!onShowMore) return
          const nextLimit = currentLimit + SHOW_MORE_BATCH
          currentLimit = nextLimit
          elements!.showMoreBtn.disabled = true
          elements!.showMoreBtn.textContent = "Loading…"
          onShowMore(currentQuery, nextLimit)
        }
      )
      if (!onRefine) elements.refineBtn.style.display = "none"
    }
    return elements
  }

  function render(args: unknown) {
    const el = ensureElements()
    // Re-attach in case another UI replaced us in the DOM.
    if (el.card.parentElement !== root) {
      root.replaceChildren(el.card)
    }
    const parsed = normalizeArgs(args)
    const isNewQuery = (parsed.query ?? "") !== currentQuery
    if (isNewQuery) {
      currentQuery = parsed.query ?? ""
      currentLimit = INITIAL_LIMIT
      renderedUuids.clear()
      el.listEl.replaceChildren()
    }
    el.showMoreBtn.disabled = false
    el.showMoreBtn.textContent = "Show more"

    const chips = buildFilterChips(
      parsed.parsed,
      parsed.query ?? parsed.searchKeyword,
      {
        persons: parsed.matchedPersons,
        locations: parsed.matchedLocations,
        orgs: parsed.matchedOrgs
      }
    )
    el.subheader.replaceChildren()
    if (chips.length > 0) {
      for (const chip of chips) {
        const chipEl = document.createElement("span")
        chipEl.className = `filter-chip filter-chip--${chip.kind}`
        chipEl.textContent = chip.label
        el.subheader.append(chipEl)
      }
      el.subheader.style.display = ""
    } else {
      el.subheader.style.display = "none"
    }

    el.statusEl.textContent = ""

    if (parsed.reports.length === 0 && renderedUuids.size === 0) {
      el.header.textContent = parsed.query
        ? `Results for "${parsed.query}"`
        : "Search Results"
      el.emptyEl.style.display = ""
      el.showMoreWrap.style.display = "none"
      return
    }
    el.emptyEl.style.display = "none"

    // Append only rows we haven't already rendered (preserves scroll position
    // across "Show more" clicks).
    for (const report of parsed.reports) {
      if (renderedUuids.has(report.uuid)) continue
      renderedUuids.add(report.uuid)

      const item = document.createElement("div")
      item.className = "result-item"

      const textWrap = document.createElement("div")
      textWrap.className = "result-item-text"

      const titleEl = document.createElement("div")
      titleEl.className = "result-item-title"
      titleEl.textContent = report.intent?.trim() || "(untitled report)"
      textWrap.append(titleEl)

      const metaText = formatMeta(report)
      if (metaText) {
        const metaEl = document.createElement("div")
        metaEl.className = "result-item-meta"
        metaEl.textContent = metaText
        textWrap.append(metaEl)
      }

      if (report.matchedBy && report.matchedBy.length > 0) {
        const badgesEl = document.createElement("div")
        badgesEl.className = "match-badges"
        for (const source of report.matchedBy) {
          const chip = document.createElement("span")
          const kind = source.split(":")[0].trim().toLowerCase()
          chip.className = `match-badge match-badge--${kind}`
          chip.textContent = source
          badgesEl.append(chip)
        }
        textWrap.append(badgesEl)
      }

      const openBtn = document.createElement("button")
      openBtn.type = "button"
      openBtn.className = "primary result-item-open"
      openBtn.textContent = "Open"
      openBtn.addEventListener("click", () => postOpenReport(report.uuid))

      item.append(textWrap, openBtn)
      el.listEl.append(item)
    }

    const couldHaveMore =
      Boolean(onShowMore) && parsed.reports.length >= currentLimit
    el.showMoreWrap.style.display = couldHaveMore ? "" : "none"

    // Header with count. "+" indicates more may be available.
    const visibleCount = renderedUuids.size
    const countText = couldHaveMore ? `${visibleCount}+` : `${visibleCount}`
    el.header.textContent = parsed.query
      ? `Results for "${parsed.query}" (${countText})`
      : `Search Results (${countText})`
  }

  return { render }
}
