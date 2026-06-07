export type CriterionStatus = "pass" | "fail" | "needs_ai"

export type BusinessCtx = {
  intent?: string
  description?: string
  keyOutcomes?: string
  nextSteps?: string
  attendees?: string[]
  tasks?: string[]
  location?: string
  advisorOrg?: string
  interlocutorOrg?: string
  authors?: string[]
  engagementDate?: string
  classification?: string
}

export type Criterion = {
  id: string
  label: string
  mode: "heuristic" | "needs_ai"
  evaluate?: (text: string, ctx: BusinessCtx) => boolean
}

export type CriterionResult = {
  id: string
  label: string
  status: CriterionStatus
}

export type FieldGroup = {
  id: string
  label: string
  items: CriterionResult[]
}

export type ChecklistReport = {
  fields: FieldGroup[]
  general: FieldGroup
}

export const FIELD_DEFS = [
  { id: "intent", label: "Engagement Purpose" },
  { id: "reportText", label: "Engagement Details" },
  { id: "keyOutcomes", label: "Key Outcomes" },
  { id: "nextSteps", label: "Next Steps" }
] as const

export type FieldId = (typeof FIELD_DEFS)[number]["id"]

const ACRONYM_PATTERN = /\b[A-Z]{2,}\b/g

// Well-known acronyms that do not need to be defined on first use.
const ACRONYM_ALLOWLIST = new Set(["NATO", "EU"])

function hasUndefinedAcronyms(text: string): boolean {
  const seen = new Set<string>()
  ACRONYM_PATTERN.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = ACRONYM_PATTERN.exec(text)) !== null) {
    if (ACRONYM_ALLOWLIST.has(m[0])) continue
    seen.add(m[0])
  }
  if (seen.size === 0) return false
  for (const acr of seen) {
    const defPattern = new RegExp(
      `(?:[A-Za-z][A-Za-z-]{2,}\\s+){1,6}\\(${acr}\\)|\\b${acr}\\s*[-=:]\\s*[A-Za-z]`
    )
    if (!defPattern.test(text)) {
      return true
    }
  }
  return false
}

const RESPONSIBILITY_PATTERN =
  /@\w+|\b(?:Mr|Mrs|Ms|Dr|Col|Gen|Capt|Lt|Sgt|Maj|LTC|COL|CPT|MAJ|SGT|GEN|LT)\.?\s+[A-Z][a-z]+|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/

const TIMELINE_PATTERN =
  /\b(?:by|before|within|until|NLT|no later than|deadline|due|asap)\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b|\b\d{1,2}[/\-]\d{1,2}(?:[/\-]\d{2,4})?\b|\bQ[1-4]\b|\b\d{4}-\d{2}-\d{2}\b/i

export type DictionaryCriterion = {
  fieldId: string
  id: string
  label: string
  heuristic?: string
  mode?: "needs_ai"
}

export function resolveHeuristic(
  name: string
): ((text: string, ctx: BusinessCtx) => boolean) | undefined {
  if (name === "nonempty") return text => text.trim().length > 0
  if (name.startsWith("maxlength:")) {
    const n = parseInt(name.slice("maxlength:".length), 10)
    if (!isNaN(n)) return text => text.length <= n
  }
  if (name === "no-undefined-acronyms") return text => !hasUndefinedAcronyms(text)
  if (name === "has-entities") {
    return (_, ctx) =>
      (ctx.attendees?.length ?? 0) > 0 ||
      (ctx.tasks?.length ?? 0) > 0 ||
      Boolean(ctx.location && ctx.location.trim().length > 0)
  }
  if (name === "has-responsibility") return text => RESPONSIBILITY_PATTERN.test(text)
  if (name === "has-timeline") return text => TIMELINE_PATTERN.test(text)
  return undefined
}

export function buildDynamicCriteria(
  rawList: DictionaryCriterion[]
): Record<string, Criterion[]> {
  const result: Record<string, Criterion[]> = {}
  for (const raw of rawList) {
    const evaluate =
      raw.mode === "needs_ai" || !raw.heuristic
        ? undefined
        : resolveHeuristic(raw.heuristic)
    const criterion: Criterion = {
      id: raw.id,
      label: raw.label,
      mode: raw.mode === "needs_ai" || !raw.heuristic ? "needs_ai" : "heuristic",
      evaluate
    }
    if (!result[raw.fieldId]) result[raw.fieldId] = []
    result[raw.fieldId].push(criterion)
  }
  return result
}

export function evaluateCriterion(
  criterion: Criterion,
  text: string,
  ctx: BusinessCtx
): CriterionStatus {
  if (criterion.mode === "needs_ai" || !criterion.evaluate) {
    return "needs_ai"
  }
  try {
    return criterion.evaluate(text, ctx) ? "pass" : "fail"
  } catch {
    return "needs_ai"
  }
}

export function fieldTextFor(fieldId: FieldId, ctx: BusinessCtx): string {
  switch (fieldId) {
    case "intent":
      return ctx.intent ?? ""
    case "reportText":
      return ctx.description ?? ""
    case "keyOutcomes":
      return ctx.keyOutcomes ?? ""
    case "nextSteps":
      return ctx.nextSteps ?? ""
    default:
      return ""
  }
}

export function buildChecklist(
  ctx: BusinessCtx,
  criteriaMap: Record<string, Criterion[]>
): ChecklistReport {
  const generalCriteria = criteriaMap["general"] ?? []
  const fieldDefs = FIELD_DEFS.filter(def => (criteriaMap[def.id]?.length ?? 0) > 0)

  const fields: FieldGroup[] = fieldDefs.map(def => ({
    id: def.id,
    label: def.label,
    items: (criteriaMap[def.id] ?? []).map(c => ({
      id: c.id,
      label: c.label,
      status: evaluateCriterion(c, fieldTextFor(def.id, ctx), ctx)
    }))
  }))

  const general: FieldGroup = {
    id: "general",
    label: "General style",
    items: generalCriteria.map(c => ({
      id: c.id,
      label: c.label,
      status: evaluateCriterion(c, "", ctx)
    }))
  }

  return { fields, general }
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v
  if (v == null) return undefined
  return String(v)
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  return v.filter((x): x is string => typeof x === "string")
}

export function normalizeBusinessCtx(bo: unknown): BusinessCtx {
  if (!bo || typeof bo !== "object") return {}
  const r = bo as Record<string, unknown>
  const rc = (r.relatedContext && typeof r.relatedContext === "object"
    ? r.relatedContext
    : {}) as Record<string, unknown>
  return {
    intent: asString(r.title) ?? asString(r.intent),
    description: asString(r.description) ?? asString(r.reportText),
    keyOutcomes: asString(rc.keyOutcomes) ?? asString(r.keyOutcomes),
    nextSteps: asString(rc.nextSteps) ?? asString(r.nextSteps),
    attendees: asStringArray(rc.attendees) ?? asStringArray(r.attendees),
    tasks: asStringArray(rc.tasks) ?? asStringArray(r.tasks),
    location: asString(rc.location) ?? asString(r.location),
    advisorOrg: asString(rc.advisorOrg) ?? asString(r.advisorOrg),
    interlocutorOrg: asString(rc.interlocutorOrg) ?? asString(r.interlocutorOrg),
    authors: asStringArray(rc.authors) ?? asStringArray(r.authors),
    engagementDate: asString(rc.engagementDate) ?? asString(r.engagementDate),
    classification: asString(rc.classification) ?? asString(r.classification)
  }
}
