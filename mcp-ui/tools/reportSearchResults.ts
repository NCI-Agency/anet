import { z, type ZodTypeAny } from "zod/v3"
import { Agent, Runner, withTrace, setDefaultOpenAIKey } from "@openai/agents"
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

const RESOURCE_URI = "ui://anet-mcp-ui/app"
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 200

const LOG_VERBOSE = process.env.MCP_LOG_VERBOSE === "true"
const logVerbose = (...args: unknown[]) => {
  if (LOG_VERBOSE) console.log(...args)
}

const inputSchema: ZodTypeAny = z
  .object({
    toolName: z
      .string()
      .optional()
      .describe("Tool name for UI routing (defaults to anet_report_search_results)."),
    query: z
      .string()
      .describe("The natural-language search query submitted by the user."),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(`Max number of reports to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`),
    userToken: z
      .string()
      .optional()
      .describe(
        "Caller's ANET Keycloak bearer token. Injected by the mcp-ui iframe; " +
          "the LLM should not populate or forward this field."
      )
  })
  .passthrough()

type ReportListItem = {
  uuid: string
  intent?: string | null
  engagementDate?: string | null
  advisorOrg?: { shortName?: string | null } | null
  interlocutorOrg?: { shortName?: string | null } | null
  location?: { name?: string | null } | null
  // Populated during merge: which sources contributed this report to the result set.
  matchedBy?: string[]
}

function mergeMatchedBy(
  a: ReportListItem,
  b: ReportListItem
): ReportListItem {
  const merged: string[] = []
  for (const src of a.matchedBy ?? []) if (!merged.includes(src)) merged.push(src)
  for (const src of b.matchedBy ?? []) if (!merged.includes(src)) merged.push(src)
  return { ...a, matchedBy: merged.length > 0 ? merged : undefined }
}

function withSource(r: ReportListItem, source: string): ReportListItem {
  const existing = r.matchedBy ?? []
  if (existing.includes(source)) return r
  return { ...r, matchedBy: [...existing, source] }
}

const REPORT_FIELDS = /* GraphQL */ `
  uuid
  intent
  engagementDate
  advisorOrg { shortName }
  interlocutorOrg { shortName }
  location { name }
`

type PersonHit = {
  uuid?: string
  name?: string
  attendedReports?: { list?: ReportListItem[] }
  authoredReports?: { list?: ReportListItem[] }
}

type LocationHit = {
  uuid?: string
  name?: string
}

type OrgHit = {
  uuid?: string
  shortName?: string
  longName?: string
}

type ParsedQuery = {
  text?: string
  personNames?: string[]
  locationNames?: string[]
  orgNames?: string[]
  // ISO date (YYYY-MM-DD) bounds for engagementDate.
  engagementDateStart?: string
  engagementDateEnd?: string
}

// Convert YYYY-MM-DD to ISO Instant strings for GraphQL.
function toInstantStart(d: string): string {
  return `${d}T00:00:00Z`
}
function toInstantEnd(d: string): string {
  return `${d}T23:59:59Z`
}

// --- GraphQL queries ----------------------------------------------------------

// Broad search: text across reports + entity name lookups (used when the user only
// gave a single concept and we want to cover all possible dimensions).
const BROAD_SEARCH_QUERY = /* GraphQL */ `
  query BroadSearch(
    $text: String
    $pageSize: Int
    $startDate: Instant
    $endDate: Instant
  ) {
    reportList(
      query: {
        pageSize: $pageSize
        state: [APPROVED, PUBLISHED]
        sortBy: ENGAGEMENT_DATE
        sortOrder: DESC
        text: $text
        engagementDateStart: $startDate
        engagementDateEnd: $endDate
      }
    ) {
      totalCount
      list { ${REPORT_FIELDS} }
    }
    personList(query: { pageSize: 5, text: $text }) {
      list {
        uuid
        name
        attendedReports(
          query: {
            pageSize: $pageSize
            state: [APPROVED, PUBLISHED]
            sortBy: ENGAGEMENT_DATE
            sortOrder: DESC
            engagementDateStart: $startDate
            engagementDateEnd: $endDate
          }
        ) {
          list { ${REPORT_FIELDS} }
        }
        authoredReports(
          query: {
            pageSize: $pageSize
            state: [APPROVED, PUBLISHED]
            sortBy: ENGAGEMENT_DATE
            sortOrder: DESC
            engagementDateStart: $startDate
            engagementDateEnd: $endDate
          }
        ) {
          list { ${REPORT_FIELDS} }
        }
      }
    }
    locationList(query: { pageSize: 5, text: $text }) {
      list { uuid name }
    }
    organizationList(query: { pageSize: 5, text: $text }) {
      list { uuid shortName longName }
    }
  }
`

const REPORTS_BY_LOCATION_QUERY = /* GraphQL */ `
  query ReportsByLocation(
    $locationUuid: [String]
    $text: String
    $pageSize: Int
    $startDate: Instant
    $endDate: Instant
  ) {
    reportList(
      query: {
        pageSize: $pageSize
        state: [APPROVED, PUBLISHED]
        sortBy: ENGAGEMENT_DATE
        sortOrder: DESC
        locationUuid: $locationUuid
        text: $text
        engagementDateStart: $startDate
        engagementDateEnd: $endDate
      }
    ) {
      list { ${REPORT_FIELDS} }
    }
  }
`

const REPORTS_BY_ORG_QUERY = /* GraphQL */ `
  query ReportsByOrg(
    $orgUuid: [String]
    $text: String
    $pageSize: Int
    $startDate: Instant
    $endDate: Instant
  ) {
    reportList(
      query: {
        pageSize: $pageSize
        state: [APPROVED, PUBLISHED]
        sortBy: ENGAGEMENT_DATE
        sortOrder: DESC
        orgUuid: $orgUuid
        orgRecurseStrategy: CHILDREN
        text: $text
        engagementDateStart: $startDate
        engagementDateEnd: $endDate
      }
    ) {
      list { ${REPORT_FIELDS} }
    }
  }
`

// Compound: lookup persons by name, return their reports filtered by topic text.
const PERSON_COMPOUND_QUERY = /* GraphQL */ `
  query PersonCompound(
    $personText: String
    $reportText: String
    $pageSize: Int
    $startDate: Instant
    $endDate: Instant
  ) {
    personList(query: { pageSize: 5, text: $personText }) {
      list {
        uuid
        name
        attendedReports(
          query: {
            pageSize: $pageSize
            state: [APPROVED, PUBLISHED]
            sortBy: ENGAGEMENT_DATE
            sortOrder: DESC
            text: $reportText
            engagementDateStart: $startDate
            engagementDateEnd: $endDate
          }
        ) {
          list { ${REPORT_FIELDS} }
        }
        authoredReports(
          query: {
            pageSize: $pageSize
            state: [APPROVED, PUBLISHED]
            sortBy: ENGAGEMENT_DATE
            sortOrder: DESC
            text: $reportText
            engagementDateStart: $startDate
            engagementDateEnd: $endDate
          }
        ) {
          list { ${REPORT_FIELDS} }
        }
      }
    }
  }
`

const LOCATION_LOOKUP_QUERY = /* GraphQL */ `
  query LocationLookup($text: String) {
    locationList(query: { pageSize: 5, text: $text }) {
      list { uuid name }
    }
  }
`

const ORG_LOOKUP_QUERY = /* GraphQL */ `
  query OrgLookup($text: String) {
    organizationList(query: { pageSize: 5, text: $text }) {
      list { uuid shortName longName }
    }
  }
`

async function gqlRequest<T>(
  endpoint: string,
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    console.error(
      `[anet_report_search_results] HTTP ${response.status} body=${body.slice(0, 500)}`
    )
    throw new Error(
      `ANET GraphQL responded ${response.status} ${response.statusText}`
    )
  }

  const json = (await response.json()) as {
    data?: T
    errors?: Array<{ message?: string }>
  }
  if (json.errors && json.errors.length > 0) {
    console.error("[anet_report_search_results] GraphQL errors:", json.errors)
    const message = json.errors.map(e => e.message ?? "(no message)").join("; ")
    throw new Error(`ANET GraphQL error: ${message}`)
  }
  if (!json.data) {
    throw new Error("ANET GraphQL returned no data")
  }
  return json.data
}

let parseAgentInstance: Agent | null = null
let parseRunnerInstance: Runner | null = null

function getParseAgent(): Agent {
  if (parseAgentInstance) return parseAgentInstance

  const baseURL =
    process.env.ANET_AGENT_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    process.env.OPENAI_API_BASE ??
    ""
  const apiKey =
    process.env.ANET_AGENT_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.OPENAI_API_TOKEN ??
    ""
  const model =
    process.env.ANET_AGENT_MODEL ??
    process.env.OPENAI_MODEL ??
    process.env.ANET_MODEL ??
    ""

  if (!baseURL) throw new Error("Missing ANET_AGENT_BASE_URL (or OPENAI_BASE_URL).")
  if (!apiKey) throw new Error("Missing ANET_AGENT_API_KEY (or OPENAI_API_KEY).")
  if (!model) throw new Error("Missing ANET_AGENT_MODEL (or OPENAI_MODEL).")

  if (!process.env.OPENAI_BASE_URL) process.env.OPENAI_BASE_URL = baseURL
  if (!process.env.OPENAI_AGENTS_DISABLE_TRACING) {
    process.env.OPENAI_AGENTS_DISABLE_TRACING = "1"
  }
  setDefaultOpenAIKey(apiKey)

  parseAgentInstance = new Agent({
    name: "ANET Report Search Query Parser",
    model,
    instructions:
      "You parse natural-language ANET report search queries into structured search filters. " +
      "The input you receive is formatted as two lines:\n" +
      "Today: <YYYY-MM-DD>\n" +
      "Query: <user query>\n" +
      "Use the Today value as the reference point for any relative date phrases in the query. " +
      "Return ONLY a JSON object with these optional fields (omit any that don't apply, do NOT include nulls): " +
      '"text" — the topic/keyword to search inside report body content (1-3 words, single string). ' +
      '"personNames" — an array of person surnames mentioned in the query. ' +
      '"locationNames" — an array of place names mentioned in the query. ' +
      '"orgNames" — an array of organization short names, abbreviations, or codes. ' +
      '"engagementDateStart" — earliest engagement date as YYYY-MM-DD (inclusive). ' +
      '"engagementDateEnd" — latest engagement date as YYYY-MM-DD (inclusive). ' +
      "Rules: " +
      'Strip filler words like "find", "show", "reports", "engagements", "about", "involving", "in", "by", "at", "with", "and", "or", "the", "all", "any", "me", "my", "our". ' +
      "Classify proper nouns by pattern: " +
      "PERSONS — a single capitalized word that reads like a surname, especially when preceded by by/with/from/involving. " +
      "LOCATIONS — names of places (cities, bases, buildings, regions); single or multi-word. " +
      "ORGANIZATIONS — recognize by pattern regardless of how the user typed the case: " +
      "(a) short acronyms or initialisms of 2-5 letters; " +
      "(b) letter codes followed by digits and dots (e.g. 'AB 1.2'); " +
      "(c) multi-word phrases containing institutional words like Ministry, Department, Agency, Brigade, Battalion, Administrators. " +
      "When you classify an acronym as an org, preserve a sensible canonical spelling. " +
      "DATES — resolve relative phrases to absolute YYYY-MM-DD using Today as the reference: " +
      '"today" -> start=end=Today. ' +
      '"yesterday" -> start=end=Today-1. ' +
      '"this week" -> start=Monday of current ISO week, end=Today. ' +
      '"last week" -> Monday to Sunday of the previous ISO week. ' +
      '"this month" -> first day of current month to Today. ' +
      '"last month" -> first to last day of previous month. ' +
      '"this quarter" -> first day of current calendar quarter to Today. ' +
      '"last quarter" -> first to last day of previous calendar quarter. ' +
      '"this year" -> January 1 of current year to Today. ' +
      '"last year" -> January 1 to December 31 of previous year. ' +
      '"in <month>" or "in <month> <year>" -> first to last day of that month (year defaults to current). ' +
      '"before <date phrase>" -> only engagementDateEnd, set to the day before the resolved date. ' +
      '"after <date phrase>" -> only engagementDateStart, set to the day after the resolved date. ' +
      '"since <date phrase>" -> only engagementDateStart at the resolved date. ' +
      "Generic topics, concepts, equipment, or actions go in text. " +
      "When multiple entities of the same type appear, list them all in the array. " +
      "If a single bare proper noun could plausibly be a person OR a body-text term (ambiguous), prefer text. " +
      "Examples — the names and dates below are illustrative; apply the pattern: " +
      'For Today=2026-05-11: "reports last quarter" -> {"engagementDateStart":"2026-01-01","engagementDateEnd":"2026-03-31"} | ' +
      'For Today=2026-05-11: "phishing this month" -> {"text":"phishing","engagementDateStart":"2026-05-01","engagementDateEnd":"2026-05-11"} | ' +
      'For Today=2026-05-11: "Smith in March" -> {"personNames":["Smith"],"engagementDateStart":"2026-03-01","engagementDateEnd":"2026-03-31"} | ' +
      'For Today=2026-05-11: "after January 2026" -> {"engagementDateStart":"2026-02-01"} | ' +
      '"find reports about phishing" -> {"text":"phishing"} | ' +
      '"reports involving Smith" -> {"personNames":["Smith"]} | ' +
      '"Smith phishing" -> {"text":"phishing","personNames":["Smith"]} | ' +
      '"Smith Jones" -> {"personNames":["Smith","Jones"]} | ' +
      '"engagements in Townsville about logistics" -> {"text":"logistics","locationNames":["Townsville"]} | ' +
      '"AB 1.1 cyber threats" -> {"text":"cyber threats","orgNames":["AB 1.1"]} | ' +
      '"xyz test" -> {"text":"test","orgNames":["XYZ"]} | ' +
      '"reports by Doe at North Base" -> {"personNames":["Doe"],"locationNames":["North Base"]} | ' +
      '"supply chain" -> {"text":"supply chain"} | ' +
      '"Smith" -> {"text":"Smith"}. ' +
      "Return ONLY the JSON, no other text, no markdown, no code fences."
  })

  if (!parseRunnerInstance) {
    parseRunnerInstance = new Runner({
      tracingDisabled: true,
      traceIncludeSensitiveData: false
    })
  }

  return parseAgentInstance
}

function sanitizeStringArray(v: unknown): string[] | undefined {
  // Accept arrays of strings, or a single string (be lenient with the model output).
  if (typeof v === "string" && v.trim().length > 0) return [v.trim()]
  if (!Array.isArray(v)) return undefined
  const cleaned = v
    .filter((x): x is string => typeof x === "string")
    .map(x => x.trim())
    .filter(x => x.length > 0)
  return cleaned.length > 0 ? cleaned : undefined
}

function sanitizeDate(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const trimmed = v.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  // Tolerate full ISO datetimes; slice to date.
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10)
  return undefined
}

function sanitizeParsed(parsed: unknown): ParsedQuery {
  if (!parsed || typeof parsed !== "object") return {}
  const r = parsed as Record<string, unknown>
  const out: ParsedQuery = {}
  if (typeof r.text === "string" && r.text.trim().length > 0) {
    out.text = r.text.trim()
  }
  // Tolerate the model returning legacy singular keys (personName/locationName/orgName)
  // by folding them into the plural arrays.
  const personNames = sanitizeStringArray(r.personNames ?? r.personName)
  if (personNames) out.personNames = personNames
  const locationNames = sanitizeStringArray(r.locationNames ?? r.locationName)
  if (locationNames) out.locationNames = locationNames
  const orgNames = sanitizeStringArray(r.orgNames ?? r.orgName)
  if (orgNames) out.orgNames = orgNames
  const start = sanitizeDate(r.engagementDateStart)
  if (start) out.engagementDateStart = start
  const end = sanitizeDate(r.engagementDateEnd)
  if (end) out.engagementDateEnd = end
  return out
}

async function parseQuery(query: string): Promise<ParsedQuery> {
  const trimmed = query.trim()
  // Single-word queries: skip the agent, treat as broad text — always covered the
  // 4 dimensions in the broad search anyway.
  if (trimmed.split(/\s+/).length === 1) {
    return { text: trimmed }
  }

  try {
    const agent = getParseAgent()
    const runner = parseRunnerInstance ?? new Runner({ tracingDisabled: true })
    parseRunnerInstance = runner

    const today = new Date().toISOString().slice(0, 10)
    const agentInput = `Today: ${today}\nQuery: ${trimmed}`
    const result = await withTrace("anet-search-query-parse", () =>
      runner.run(agent, agentInput)
    )
    const raw =
      typeof result.finalOutput === "string" ? result.finalOutput.trim() : ""
    const json = raw.replace(/^```(?:json)?\n?|\n?```$/g, "").trim()
    const parsed = sanitizeParsed(JSON.parse(json))

    if (Object.keys(parsed).length === 0) {
      logVerbose(
        `[anet_report_search_results] parser returned empty; falling back to text=${JSON.stringify(trimmed)}`
      )
      return { text: trimmed }
    }

    logVerbose(
      `[anet_report_search_results] parsed query "${trimmed}" -> ${JSON.stringify(parsed)}`
    )
    return parsed
  } catch (err) {
    console.error(
      `[anet_report_search_results] query parse failed for "${trimmed}":`,
      err instanceof Error ? err.message : err
    )
    return { text: trimmed }
  }
}

async function broadSearch(
  text: string,
  limit: number,
  endpoint: string,
  token: string,
  startDate: string | null,
  endDate: string | null
): Promise<{ reports: ReportListItem[]; totalCount: number }> {
  const step1 = await gqlRequest<{
    reportList?: { totalCount?: number; list?: ReportListItem[] }
    personList?: { list?: PersonHit[] }
    locationList?: { list?: LocationHit[] }
    organizationList?: { list?: OrgHit[] }
  }>(endpoint, token, BROAD_SEARCH_QUERY, {
    text,
    pageSize: limit,
    startDate,
    endDate
  })

  const textMatches = step1.reportList?.list ?? []
  const textTotalCount = step1.reportList?.totalCount ?? textMatches.length

  // ANET FTS on persons/locations/orgs matches across many fields (position name,
  // biography, etc.), which produces incidental hits like a person named "Smith"
  // whose position description happens to contain the keyword. For broad-search
  // tagging we only want to surface entity matches that line up with the entity's
  // own name — otherwise the chips become noise.
  const keywordLower = text.toLowerCase().trim()
  const nameContains = (name: string | undefined | null) => {
    // Empty keyword (e.g. date-only query) → no entity matches; otherwise every
    // entity would pass since `.includes("")` is trivially true.
    if (keywordLower.length === 0) return false
    return typeof name === "string" && name.toLowerCase().includes(keywordLower)
  }

  const persons = (step1.personList?.list ?? []).filter(p =>
    nameContains(p.name)
  )
  const locations = (step1.locationList?.list ?? []).filter(l =>
    nameContains(l.name)
  )
  const orgs = (step1.organizationList?.list ?? []).filter(
    o => nameContains(o.shortName) || nameContains(o.longName)
  )
  const locationUuids = locations
    .map(l => l.uuid)
    .filter((u): u is string => typeof u === "string" && u.length > 0)
  const orgUuids = orgs
    .map(o => o.uuid)
    .filter((u): u is string => typeof u === "string" && u.length > 0)

  const [locationReports, orgReports] = await Promise.all([
    locationUuids.length > 0
      ? gqlRequest<{ reportList?: { list?: ReportListItem[] } }>(
          endpoint,
          token,
          REPORTS_BY_LOCATION_QUERY,
          {
            locationUuid: locationUuids,
            text: null,
            pageSize: limit,
            startDate,
            endDate
          }
        ).then(r => r.reportList?.list ?? [])
      : Promise.resolve<ReportListItem[]>([]),
    orgUuids.length > 0
      ? gqlRequest<{ reportList?: { list?: ReportListItem[] } }>(
          endpoint,
          token,
          REPORTS_BY_ORG_QUERY,
          {
            orgUuid: orgUuids,
            text: null,
            pageSize: limit,
            startDate,
            endDate
          }
        ).then(r => r.reportList?.list ?? [])
      : Promise.resolve<ReportListItem[]>([])
  ])

  const seen = new Map<string, ReportListItem>()
  const addOrTag = (r: ReportListItem, source: string | null) => {
    if (!r.uuid) return
    const existing = seen.get(r.uuid)
    const tagged = source ? withSource(r, source) : r
    seen.set(r.uuid, existing ? mergeMatchedBy(existing, tagged) : tagged)
  }
  // Only emit a `text:` tag when we actually searched by text. For date-only
  // (or other text-less) queries, just keep the report in the result set with
  // no per-row source label.
  const textSource = text.length > 0 ? `text: ${text}` : null
  for (const r of textMatches) addOrTag(r, textSource)
  for (const person of persons) {
    const pname = person.name ?? "person"
    for (const r of person.attendedReports?.list ?? [])
      addOrTag(r, `attendee: ${pname}`)
    for (const r of person.authoredReports?.list ?? [])
      addOrTag(r, `author: ${pname}`)
  }
  for (const r of locationReports) {
    const lname = r.location?.name?.trim() || text
    addOrTag(r, `location: ${lname}`)
  }
  for (const r of orgReports) {
    // The report has advisorOrg and interlocutorOrg; the org that matched our
    // keyword is whichever's shortName/longName contains it (could be either or both).
    const advisorName = r.advisorOrg?.shortName?.trim() ?? ""
    const interlocutorName = r.interlocutorOrg?.shortName?.trim() ?? ""
    const advisorMatches =
      advisorName.length > 0 && advisorName.toLowerCase().includes(keywordLower)
    const interlocutorMatches =
      interlocutorName.length > 0 &&
      interlocutorName.toLowerCase().includes(keywordLower)
    if (advisorMatches) addOrTag(r, `org: ${advisorName}`)
    if (interlocutorMatches && interlocutorName !== advisorName) {
      addOrTag(r, `org: ${interlocutorName}`)
    }
    if (!advisorMatches && !interlocutorMatches) {
      // Fallback (shouldn't normally happen given the name-match guard, but be safe).
      addOrTag(r, `org: ${text}`)
    }
  }

  // If a date filter was applied, tag each report with its own engagement date.
  if (startDate || endDate) {
    for (const [uuid, report] of seen) {
      const iso = report.engagementDate
      const dateStr = typeof iso === "string" ? iso.slice(0, 10) : null
      if (dateStr) {
        seen.set(uuid, withSource(report, `date: ${dateStr}`))
      }
    }
  }

  const merged = Array.from(seen.values()).slice(0, limit)
  const personSummary = persons
    .map(p => `${p.name ?? "?"} (${p.uuid?.slice(0, 8) ?? "?"})`)
    .join(", ")
  const locationSummary = locations
    .map(l => `${l.name ?? "?"} (${l.uuid?.slice(0, 8) ?? "?"})`)
    .join(", ")
  const orgSummary = orgs
    .map(o => `${o.shortName ?? o.longName ?? "?"} (${o.uuid?.slice(0, 8) ?? "?"})`)
    .join(", ")
  logVerbose(
    `[anet_report_search_results] broad OK textCount=${textMatches.length} textTotal=${textTotalCount} persons=[${personSummary}] locations=[${locationSummary}] locReports=${locationReports.length} orgs=[${orgSummary}] orgReports=${orgReports.length} merged=${merged.length}`
  )
  return { reports: merged, totalCount: merged.length }
}

async function personCompound(
  personName: string,
  reportText: string | undefined,
  limit: number,
  endpoint: string,
  token: string,
  startDate: string | null,
  endDate: string | null
): Promise<{ reports: ReportListItem[]; label: string }> {
  const data = await gqlRequest<{ personList?: { list?: PersonHit[] } }>(
    endpoint,
    token,
    PERSON_COMPOUND_QUERY,
    {
      personText: personName,
      reportText: reportText ?? null,
      pageSize: limit,
      startDate,
      endDate
    }
  )
  const persons = data.personList?.list ?? []
  const reports: ReportListItem[] = []
  for (const p of persons) {
    for (const r of p.attendedReports?.list ?? []) {
      let tagged = withSource(r, `attendee: ${personName}`)
      if (reportText) tagged = withSource(tagged, `text: ${reportText}`)
      reports.push(tagged)
    }
    for (const r of p.authoredReports?.list ?? []) {
      let tagged = withSource(r, `author: ${personName}`)
      if (reportText) tagged = withSource(tagged, `text: ${reportText}`)
      reports.push(tagged)
    }
  }
  const summary = persons
    .map(p => `${p.name ?? "?"} (${p.uuid?.slice(0, 8) ?? "?"})`)
    .join(", ")
  return {
    reports,
    label: `person="${personName}" persons=[${summary}] reports=${reports.length}`
  }
}

async function locationCompound(
  locationName: string,
  reportText: string | undefined,
  limit: number,
  endpoint: string,
  token: string,
  startDate: string | null,
  endDate: string | null
): Promise<{ reports: ReportListItem[]; label: string }> {
  const lookup = await gqlRequest<{ locationList?: { list?: LocationHit[] } }>(
    endpoint,
    token,
    LOCATION_LOOKUP_QUERY,
    { text: locationName }
  )
  const locations = lookup.locationList?.list ?? []
  const uuids = locations
    .map(l => l.uuid)
    .filter((u): u is string => typeof u === "string" && u.length > 0)
  let reports: ReportListItem[] = []
  if (uuids.length > 0) {
    const data = await gqlRequest<{ reportList?: { list?: ReportListItem[] } }>(
      endpoint,
      token,
      REPORTS_BY_LOCATION_QUERY,
      {
        locationUuid: uuids,
        text: reportText ?? null,
        pageSize: limit,
        startDate,
        endDate
      }
    )
    reports = (data.reportList?.list ?? []).map(r => {
      let tagged = withSource(r, `location: ${locationName}`)
      if (reportText) tagged = withSource(tagged, `text: ${reportText}`)
      return tagged
    })
  }
  const summary = locations
    .map(l => `${l.name ?? "?"} (${l.uuid?.slice(0, 8) ?? "?"})`)
    .join(", ")
  return {
    reports,
    label: `location="${locationName}" locs=[${summary}] reports=${reports.length}`
  }
}

async function orgCompound(
  orgName: string,
  reportText: string | undefined,
  limit: number,
  endpoint: string,
  token: string,
  startDate: string | null,
  endDate: string | null
): Promise<{ reports: ReportListItem[]; label: string }> {
  const lookup = await gqlRequest<{
    organizationList?: { list?: OrgHit[] }
  }>(endpoint, token, ORG_LOOKUP_QUERY, { text: orgName })
  const orgs = lookup.organizationList?.list ?? []
  const uuids = orgs
    .map(o => o.uuid)
    .filter((u): u is string => typeof u === "string" && u.length > 0)
  let reports: ReportListItem[] = []
  if (uuids.length > 0) {
    const data = await gqlRequest<{ reportList?: { list?: ReportListItem[] } }>(
      endpoint,
      token,
      REPORTS_BY_ORG_QUERY,
      {
        orgUuid: uuids,
        text: reportText ?? null,
        pageSize: limit,
        startDate,
        endDate
      }
    )
    reports = (data.reportList?.list ?? []).map(r => {
      let tagged = withSource(r, `org: ${orgName}`)
      if (reportText) tagged = withSource(tagged, `text: ${reportText}`)
      return tagged
    })
  }
  const summary = orgs
    .map(o => `${o.shortName ?? o.longName ?? "?"} (${o.uuid?.slice(0, 8) ?? "?"})`)
    .join(", ")
  return {
    reports,
    label: `org="${orgName}" orgs=[${summary}] reports=${reports.length}`
  }
}

// Higher per-entity fetch ceiling so the intersection has enough candidates
// even when one entity has many reports.
const ENTITY_FETCH_LIMIT = 200

type EntityType = "person" | "location" | "org"
type Tagged = {
  type: EntityType
  reports: ReportListItem[]
  label: string
}

function intersectMaps(
  maps: Map<string, ReportListItem>[]
): Map<string, ReportListItem> {
  if (maps.length === 0) return new Map()
  let acc: Map<string, ReportListItem> = new Map(maps[0])
  for (let i = 1; i < maps.length; i++) {
    const next = new Map<string, ReportListItem>()
    for (const [uuid, report] of acc) {
      const other = maps[i].get(uuid)
      if (other) next.set(uuid, mergeMatchedBy(report, other))
    }
    acc = next
  }
  return acc
}

function unionResults(results: Tagged[]): Map<string, ReportListItem> {
  const out = new Map<string, ReportListItem>()
  for (const r of results) {
    for (const rr of r.reports) {
      if (!rr.uuid) continue
      const existing = out.get(rr.uuid)
      out.set(rr.uuid, existing ? mergeMatchedBy(existing, rr) : { ...rr })
    }
  }
  return out
}

function intersectResults(results: Tagged[]): Map<string, ReportListItem> {
  return intersectMaps(
    results.map(r => {
      const m = new Map<string, ReportListItem>()
      for (const rr of r.reports) {
        if (!rr.uuid) continue
        const existing = m.get(rr.uuid)
        m.set(rr.uuid, existing ? mergeMatchedBy(existing, rr) : { ...rr })
      }
      return m
    })
  )
}

async function compoundSearch(
  parsed: ParsedQuery,
  limit: number,
  endpoint: string,
  token: string
): Promise<{ reports: ReportListItem[]; totalCount: number }> {
  const text = parsed.text
  const startDate = parsed.engagementDateStart
    ? toInstantStart(parsed.engagementDateStart)
    : null
  const endDate = parsed.engagementDateEnd
    ? toInstantEnd(parsed.engagementDateEnd)
    : null
  const promises: Promise<Tagged>[] = []
  for (const personName of parsed.personNames ?? []) {
    promises.push(
      personCompound(
        personName,
        text,
        ENTITY_FETCH_LIMIT,
        endpoint,
        token,
        startDate,
        endDate
      ).then(r => ({ ...r, type: "person" as const }))
    )
  }
  for (const locationName of parsed.locationNames ?? []) {
    promises.push(
      locationCompound(
        locationName,
        text,
        ENTITY_FETCH_LIMIT,
        endpoint,
        token,
        startDate,
        endDate
      ).then(r => ({ ...r, type: "location" as const }))
    )
  }
  for (const orgName of parsed.orgNames ?? []) {
    promises.push(
      orgCompound(
        orgName,
        text,
        ENTITY_FETCH_LIMIT,
        endpoint,
        token,
        startDate,
        endDate
      ).then(r => ({ ...r, type: "org" as const }))
    )
  }
  const results = await Promise.all(promises)

  // Group by type
  const persons = results.filter(r => r.type === "person")
  const locations = results.filter(r => r.type === "location")
  const orgs = results.filter(r => r.type === "org")

  // Per-type combine:
  //   persons   → intersect (a report can have multiple attendees/authors,
  //               so reports involving every named person is meaningful)
  //   locations → union (a report has a single location, so within-type
  //               intersection is structurally always empty)
  //   orgs      → union (orgUuid filter is OR-based; true intersect of
  //               advisor/interlocutor would need separate filters)
  const typeMaps: Map<string, ReportListItem>[] = []
  if (persons.length > 0) typeMaps.push(intersectResults(persons))
  if (locations.length > 0) typeMaps.push(unionResults(locations))
  if (orgs.length > 0) typeMaps.push(unionResults(orgs))

  // Cross-type intersection: a report must satisfy every type group.
  const finalMap = intersectMaps(typeMaps)

  // If a date filter was applied, tag each report with its own engagement date.
  if (parsed.engagementDateStart || parsed.engagementDateEnd) {
    for (const [uuid, report] of finalMap) {
      const iso = report.engagementDate
      const dateStr = typeof iso === "string" ? iso.slice(0, 10) : null
      if (dateStr) {
        finalMap.set(uuid, withSource(report, `date: ${dateStr}`))
      }
    }
  }

  const merged = Array.from(finalMap.values()).slice(0, limit)

  const partSummary = (
    [
      persons.length > 0
        ? `persons(∩)=[${persons.map(r => r.label).join(" ∩ ")}]`
        : "",
      locations.length > 0
        ? `locations(∪)=[${locations.map(r => r.label).join(" ∪ ")}]`
        : "",
      orgs.length > 0 ? `orgs(∪)=[${orgs.map(r => r.label).join(" ∪ ")}]` : ""
    ].filter(Boolean) as string[]
  ).join(" ∩ ")
  logVerbose(
    `[anet_report_search_results] compound text=${text ? `"${text}"` : "(none)"} ${partSummary} merged=${merged.length}`
  )
  return { reports: merged, totalCount: merged.length }
}

async function searchReports(
  parsed: ParsedQuery,
  limit: number,
  endpoint: string,
  token: string
): Promise<{ reports: ReportListItem[]; totalCount: number }> {
  const totalEntities =
    (parsed.personNames?.length ?? 0) +
    (parsed.locationNames?.length ?? 0) +
    (parsed.orgNames?.length ?? 0)
  const hasText = !!parsed.text
  // Compound when (a) there are multiple entities (union them) or (b) entity + text
  // (intersection). Single-entity-no-text falls through to broad so we also catch
  // body-text mentions of that entity name.
  if (totalEntities >= 2 || (totalEntities >= 1 && hasText)) {
    return compoundSearch(parsed, limit, endpoint, token)
  }
  // Broad: single entity (no text) OR text-only OR nothing.
  const broadText =
    parsed.text ||
    parsed.personNames?.[0] ||
    parsed.locationNames?.[0] ||
    parsed.orgNames?.[0] ||
    ""
  const startDate = parsed.engagementDateStart
    ? toInstantStart(parsed.engagementDateStart)
    : null
  const endDate = parsed.engagementDateEnd
    ? toInstantEnd(parsed.engagementDateEnd)
    : null
  return broadSearch(broadText, limit, endpoint, token, startDate, endDate)
}

// --- Tool registration --------------------------------------------------------

export function registerReportSearchResultsTool(server: McpServer) {
  registerAppTool(
    server,
    "anet_report_search_results",
    {
      title: "ANET report search results",
      description:
        "Search ANET reports matching a natural-language query and display the matches. " +
        "This tool runs the search internally against ANET's GraphQL API; the caller does NOT need " +
        "to fetch reports first.",
      inputSchema,
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI
        }
      }
    },
    async (args?: Record<string, unknown>) => {
      const safe = args ?? {}
      const query = typeof safe.query === "string" ? safe.query.trim() : ""
      if (!query) {
        return {
          isError: true,
          content: [{ type: "text", text: "Missing or empty query." }]
        }
      }

      const requestedLimit =
        typeof safe.limit === "number" && safe.limit > 0 ? safe.limit : DEFAULT_LIMIT
      const limit = Math.min(Math.floor(requestedLimit), MAX_LIMIT)

      const endpoint =
        process.env.ANET_GRAPHQL_URL ?? "http://localhost:8080/graphql"
      const token =
        typeof safe.userToken === "string" && safe.userToken.length > 0
          ? safe.userToken
          : undefined
      logVerbose(
        `[anet_report_search_results] endpoint=${endpoint} tokenPresent=${Boolean(token)} query=${JSON.stringify(query)} limit=${limit}`
      )
      if (!token) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                "Missing userToken; mcp-ui must include the caller's bearer token in tool arguments."
            }
          ]
        }
      }

      try {
        const parsed = await parseQuery(query)
        if (Object.keys(parsed).length === 0) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Could not derive any search filters from the query."
              }
            ]
          }
        }

        const { reports, totalCount } = await searchReports(
          parsed,
          limit,
          endpoint,
          token
        )

        // searchKeyword preserves the existing UI subheader contract (single string).
        const searchKeyword =
          parsed.text ||
          parsed.personNames?.[0] ||
          parsed.locationNames?.[0] ||
          parsed.orgNames?.[0] ||
          query

        const payload = {
          toolName: "anet_report_search_results",
          query,
          parsed,
          searchKeyword,
          reports,
          totalCount
        }
        return {
          structuredContent: payload,
          content: [{ type: "text", text: "Report search results rendered." }]
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown search error."
        return {
          isError: true,
          content: [{ type: "text", text: `Search failed: ${message}` }]
        }
      }
    }
  )
}
