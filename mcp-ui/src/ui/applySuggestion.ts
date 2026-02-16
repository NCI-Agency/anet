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
}

function buildUI(root: HTMLElement): ApplySuggestionElements {
  const card = document.createElement("div")
  card.className = "card"

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
  const status = document.createElement("div")
  status.className = "status"
  actions.append(applyBtn, status)

  card.append(fieldWrap, currentWrap, suggestionWrap, actions)
  root.replaceChildren(card)

  return {
    root,
    fieldEl: fieldValue,
    currentEl: currentValue,
    suggestionEl: suggestionValue,
    statusEl: status,
    applyBtn
  }
}

export function createApplySuggestionUI(root: HTMLElement): ApplySuggestionUI {
  const elements = buildUI(root)
  let currentArgs: SuggestionArgs | null = null

  function render(args: SuggestionArgs) {
    currentArgs = args
    elements.fieldEl.textContent = args.fieldLabel ?? args.fieldId
    elements.currentEl.textContent = args.currentText ?? ""
    elements.suggestionEl.textContent = args.suggestion
    elements.applyBtn.disabled = false
  }

  function postApplyMessage() {
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
      if (window.parent) window.parent.postMessage(payload, "*")
      if (window.top && window.top !== window.parent) {
        window.top.postMessage(payload, "*")
      }
    } catch {
      elements.statusEl.textContent = "Failed to apply"
      return
    }

    elements.statusEl.textContent = "Applied to ANET"
  }

  elements.applyBtn.addEventListener("click", () => postApplyMessage())

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
