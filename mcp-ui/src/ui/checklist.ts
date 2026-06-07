import {
  buildChecklist,
  buildDynamicCriteria,
  ChecklistReport,
  Criterion,
  CriterionStatus,
  DictionaryCriterion,
  fieldTextFor,
  FieldId,
  FIELD_DEFS,
  normalizeBusinessCtx
} from "../guidance/reportCriteria"

type CallHelpRequest = {
  fieldId: string
  criterionId: string
  criterionLabel: string
  currentText?: string
  businessObject?: unknown
}

type CallHelpFn = (req: CallHelpRequest) => Promise<string | null>
type RefreshFn = () => void

type ChecklistUI = {
  render: (args: unknown) => void
}

type ChecklistElements = {
  root: HTMLElement
  card: HTMLElement
  listContainer: HTMLElement
  helpContainer: HTMLElement
  statusEl: HTMLElement
}

type ApplyMessage = {
  type: "anet.applySuggestion"
  fieldId: string
  value: string
  fieldLabel?: string
  source: "mcp-app"
}

const STATUS_ICON: Record<CriterionStatus, string> = {
  pass: "\u2713",
  fail: "\u2717",
  needs_ai: "\u25D0"
}

const FIELD_LABEL_MAP: Record<string, string> = {}
for (const def of FIELD_DEFS) {
  FIELD_LABEL_MAP[def.id] = def.label
}

function postApply(fieldId: string, value: string) {
  const payload: ApplyMessage = {
    type: "anet.applySuggestion",
    fieldId,
    value,
    fieldLabel: FIELD_LABEL_MAP[fieldId],
    source: "mcp-app"
  }
  try {
    if (!window.top || window.top === window) return
    window.top.postMessage(payload, "*")
  } catch {
    // ignore
  }
}

function buildUI(root: HTMLElement, onRefresh: RefreshFn): ChecklistElements {
  const card = document.createElement("div")
  card.className = "card"
  card.id = "mcp-ui-report-checklist"

  const header = document.createElement("div")
  header.style.display = "flex"
  header.style.justifyContent = "space-between"
  header.style.alignItems = "center"

  const title = document.createElement("div")
  title.className = "checklist-title"
  title.textContent = "Report Guidance Checklist"

  const refreshBtn = document.createElement("button")
  refreshBtn.type = "button"
  refreshBtn.textContent = "Refresh"
  refreshBtn.style.fontSize = "12px"
  refreshBtn.style.padding = "4px 10px"
  refreshBtn.addEventListener("click", onRefresh)

  header.append(title, refreshBtn)

  const listContainer = document.createElement("div")
  listContainer.className = "checklist"

  const helpContainer = document.createElement("div")
  helpContainer.className = "checklist-help"

  const status = document.createElement("div")
  status.className = "status"

  card.append(header, listContainer, helpContainer, status)
  root.replaceChildren(card)

  return { root, card, listContainer, helpContainer, statusEl: status }
}

function renderChecklistInto(
  container: HTMLElement,
  checklist: ChecklistReport,
  onHelp: (fieldId: string, criterionId: string, criterionLabel: string) => void
) {
  container.replaceChildren()
  const groups = [...checklist.fields, checklist.general]
  for (const group of groups) {
    if (group.items.length === 0) continue
    const section = document.createElement("div")
    section.className = "checklist-section"

    const header = document.createElement("div")
    header.className = "checklist-section-title"
    header.textContent = group.label
    section.append(header)

    const list = document.createElement("ul")
    list.className = "checklist-items"

    for (const item of group.items) {
      const li = document.createElement("li")
      li.className = `checklist-item checklist-item--${item.status}`

      const icon = document.createElement("span")
      icon.className = "checklist-icon"
      icon.textContent = STATUS_ICON[item.status]

      const label = document.createElement("span")
      label.className = "checklist-label"
      label.textContent = item.label

      li.append(icon, label)

      if (item.status !== "pass") {
        const helpBtn = document.createElement("button")
        helpBtn.type = "button"
        helpBtn.className = "checklist-help-btn"
        helpBtn.textContent =
          item.status === "needs_ai" ? "Get insights" : "Help me"
        helpBtn.addEventListener("click", () =>
          onHelp(group.id, item.id, item.label)
        )
        li.append(helpBtn)
      }

      list.append(li)
    }

    section.append(list)
    container.append(section)
  }
}

function appendHelpBlock(
  container: HTMLElement,
  fieldId: string,
  label: string,
  text: string,
  onApply?: (fieldId: string, text: string) => void
) {
  const block = document.createElement("div")
  block.className = "criterion-help"

  const head = document.createElement("div")
  head.className = "criterion-help-label"
  head.textContent = label

  const body = document.createElement("div")
  body.className = "criterion-help-text"
  body.textContent = text

  const actions = document.createElement("div")
  actions.style.display = "flex"
  actions.style.gap = "8px"
  actions.style.marginTop = "8px"

  if (fieldId !== "general") {
    const applyBtn = document.createElement("button")
    applyBtn.type = "button"
    applyBtn.className = "primary"
    applyBtn.textContent = "Apply"
    applyBtn.style.fontSize = "12px"
    applyBtn.style.padding = "4px 10px"
    applyBtn.addEventListener("click", () => {
      postApply(fieldId, text)
      onApply?.(fieldId, text)
      applyBtn.disabled = true
      applyBtn.textContent = "Applied"
    })
    actions.append(applyBtn)
  }

  block.append(head, body, actions)
  container.append(block)
  block.scrollIntoView({ behavior: "smooth", block: "nearest" })
}

const FIELD_IDS: FieldId[] = ["intent", "reportText", "keyOutcomes", "nextSteps"]

function isFieldId(id: string): id is FieldId {
  return (FIELD_IDS as string[]).includes(id)
}

export function createChecklistUI(
  root: HTMLElement,
  callHelp: CallHelpFn
): ChecklistUI {
  let elements: ChecklistElements | null = null
  let cachedBusinessObject: unknown = undefined
  let cachedCriteriaOverride: Record<string, Criterion[]> = {}

  // Maps fieldId to the key used in the flat businessObject the AI sends
  const FIELD_TO_BO_KEY: Record<string, string> = {
    intent: "title",
    reportText: "description",
    keyOutcomes: "keyOutcomes",
    nextSteps: "nextSteps"
  }

  function patchCachedField(fieldId: string, text: string) {
    const key = FIELD_TO_BO_KEY[fieldId]
    if (!key || !cachedBusinessObject || typeof cachedBusinessObject !== "object") return
    cachedBusinessObject = { ...(cachedBusinessObject as Record<string, unknown>), [key]: text }
  }

  function localRefresh() {
    const el = ensureElements()
    const ctx = normalizeBusinessCtx(cachedBusinessObject)
    const checklist = buildChecklist(ctx, cachedCriteriaOverride)
    renderChecklistInto(el.listContainer, checklist, (fieldId, id, label) =>
      void handleHelp(fieldId, id, label)
    )
    el.statusEl.textContent = ""
  }

  function ensureElements() {
    if (!elements) {
      elements = buildUI(root, () => {
        if (elements) elements.statusEl.textContent = "Refreshing\u2026"
        localRefresh()
      })
    }
    return elements
  }

  async function handleHelp(
    fieldId: string,
    criterionId: string,
    criterionLabel: string
  ) {
    const el = ensureElements()
    el.statusEl.textContent = `Asking AI about "${criterionLabel}"\u2026`

    const ctx = normalizeBusinessCtx(cachedBusinessObject)
    const currentText = isFieldId(fieldId) ? fieldTextFor(fieldId, ctx) : undefined

    try {
      const text = await callHelp({
        fieldId,
        criterionId,
        criterionLabel,
        currentText,
        businessObject: cachedBusinessObject
      })

      if (!text) {
        el.statusEl.textContent = "No guidance returned."
        return
      }

      appendHelpBlock(el.helpContainer, fieldId, criterionLabel, text, (fId, appliedText) => {
        patchCachedField(fId, appliedText)
        localRefresh()
      })
      el.statusEl.textContent = ""
    } catch (error) {
      const message = error instanceof Error ? error.message : "Help request failed."
      el.statusEl.textContent = message
    }
  }

  function render(args: unknown) {
    const el = ensureElements()
    const record = (args ?? {}) as Record<string, unknown>
    cachedBusinessObject = record.businessObject

    const rawCriteria = Array.isArray(
      (record.businessObject as Record<string, unknown>)?.guidanceCriteria
    )
      ? ((record.businessObject as Record<string, unknown>)
          .guidanceCriteria as DictionaryCriterion[])
      : []
    cachedCriteriaOverride = buildDynamicCriteria(rawCriteria)

    const structured = record.checklist as ChecklistReport | undefined
    const checklist: ChecklistReport = structured
      ? structured
      : buildChecklist(normalizeBusinessCtx(record.businessObject), cachedCriteriaOverride)

    renderChecklistInto(el.listContainer, checklist, (fieldId, id, label) =>
      void handleHelp(fieldId, id, label)
    )
    // Keep help blocks visible across refreshes — don't clear helpContainer
    el.statusEl.textContent = ""
  }

  return { render }
}
