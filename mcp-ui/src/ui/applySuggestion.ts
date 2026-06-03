export type SuggestionArgs = {
  fieldId: string
  fieldLabel?: string
  currentText?: string
  suggestion: string
  requestId?: string
}

type ApplyMessage = {
  type: "anet.applySuggestion"
  fieldId: string
  value: string
  fieldLabel?: string
  requestId?: string
  source: "mcp-app"
}

type OpenDiffMessage = {
  type: "anet.openSuggestionDiff"
  fieldId: string
  fieldLabel?: string
  currentText?: string
  suggestion: string
  requestId?: string
  source: "mcp-app"
}

type ApplySuggestionUI = {
  render: (args: SuggestionArgs) => void
  postApplyMessage: () => void
}

type ApplySuggestionElements = {
  root: HTMLElement
  fieldEl: HTMLElement
  currentEl: HTMLElement
  suggestionEl: HTMLElement
  statusEl: HTMLElement
  applyBtn: HTMLButtonElement
  pickBtn: HTMLButtonElement
}

function buildUI(root: HTMLElement): ApplySuggestionElements {
  const card = document.createElement("div")
  card.className = "card"
  card.id = "mcp-ui-apply-suggestion"

  const fieldWrap = document.createElement("div")
  const fieldLabel = document.createElement("div")
  fieldLabel.className = "label"
  fieldLabel.textContent = "Field"
  const fieldValue = document.createElement("div")
  fieldWrap.append(fieldLabel, fieldValue)

  const currentWrap = document.createElement("div")
  const currentLabel = document.createElement("div")
  currentLabel.className = "label"
  currentLabel.textContent = "Current"
  const currentValue = document.createElement("pre")
  currentWrap.append(currentLabel, currentValue)

  const suggestionWrap = document.createElement("div")
  const suggestionLabel = document.createElement("div")
  suggestionLabel.className = "label"
  suggestionLabel.textContent = "Suggestion"
  const suggestionValue = document.createElement("pre")
  suggestionWrap.append(suggestionLabel, suggestionValue)

  const actions = document.createElement("div")
  actions.className = "actions"
  const applyBtn = document.createElement("button")
  applyBtn.className = "primary"
  applyBtn.disabled = true
  applyBtn.textContent = "Apply to ANET"
  const pickBtn = document.createElement("button")
  pickBtn.textContent = "Pick and choose"
  const status = document.createElement("div")
  status.className = "status"
  actions.append(applyBtn, pickBtn, status)

  card.append(fieldWrap, currentWrap, suggestionWrap, actions)
  root.replaceChildren(card)

  return {
    root,
    fieldEl: fieldValue,
    currentEl: currentValue,
    suggestionEl: suggestionValue,
    statusEl: status,
    applyBtn,
    pickBtn
  }
}

export function createApplySuggestionUI(root: HTMLElement): ApplySuggestionUI {
  let elements: ApplySuggestionElements | null = null
  let isBound = false
  let currentArgs: SuggestionArgs | null = null

  // Make sure elements are created and event listeners are bound
  // before any rendering or posting occurs.
  function ensureElements() {
    if (!elements) {
      elements = buildUI(root)
    }
    if (!isBound && elements.applyBtn && elements.pickBtn) {
      elements.applyBtn.addEventListener("click", () => postApplyMessage())
      elements.pickBtn.addEventListener("click", () => postOpenDiffMessage())
      isBound = true
    }
    return elements
  }

  function render(args: SuggestionArgs) {
    const el = ensureElements()
    currentArgs = args
    el.fieldEl.textContent = args.fieldLabel ?? args.fieldId
    el.currentEl.textContent = args.currentText ?? ""
    el.suggestionEl.textContent = args.suggestion
    el.applyBtn.disabled = false
  }

  function postApplyMessage() {
    const el = ensureElements()
    if (!currentArgs) return

    const payload: ApplyMessage = {
      type: "anet.applySuggestion",
      fieldId: currentArgs.fieldId,
      value: currentArgs.suggestion,
      fieldLabel: currentArgs.fieldLabel,
      requestId: currentArgs.requestId,
      source: "mcp-app"
    }

    try {
      if (!window.top || window.top === window) {
        throw new Error("Missing top window")
      }
      window.top.postMessage(payload, "*")
    } catch {
      el.statusEl.textContent = "Failed to apply"
      return
    }

    el.statusEl.textContent = "Applied to ANET"
  }

  function postOpenDiffMessage() {
    const el = ensureElements()
    if (!currentArgs) return

    const payload: OpenDiffMessage = {
      type: "anet.openSuggestionDiff",
      fieldId: currentArgs.fieldId,
      suggestion: currentArgs.suggestion,
      fieldLabel: currentArgs.fieldLabel,
      currentText: currentArgs.currentText,
      requestId: currentArgs.requestId,
      source: "mcp-app"
    }

    try {
      if (!window.top || window.top === window) {
        throw new Error("Missing top window")
      }
      window.top.postMessage(payload, "*")
    } catch {
      el.statusEl.textContent = "Failed to open picker"
      return
    }
  }

  return {
    render,
    postApplyMessage
  }
}

export function normalizeSuggestionArgs(args: unknown): SuggestionArgs | null {
  if (!args || typeof args !== "object") return null
  const record = args as Record<string, unknown>
  const fieldId = typeof record.fieldId === "string" ? record.fieldId : ""
  const suggestion = typeof record.suggestion === "string" ? record.suggestion : ""

  if (!fieldId || !suggestion) return null

  return {
    fieldId,
    suggestion,
    fieldLabel: typeof record.fieldLabel === "string" ? record.fieldLabel : undefined,
    currentText: typeof record.currentText === "string" ? record.currentText : undefined,
    requestId: typeof record.requestId === "string" ? record.requestId : undefined
  }
}

export function renderApplySuggestionFromArgs(
  ui: ApplySuggestionUI,
  args: unknown,
  onError?: (message: string) => void
) {
  const parsed = normalizeSuggestionArgs(args)
  if (!parsed) {
    onError?.("Tool input missing fieldId or suggestion.")
    return
  }
  ui.render(parsed)
}
