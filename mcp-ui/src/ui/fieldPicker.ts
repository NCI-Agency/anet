export type SuggestionField = {
  id: string
  label: string
  description?: string
  currentText?: string
}

type FieldPickerUI = {
  render: (fields?: SuggestionField[]) => void
}

type FieldPickerElements = {
  root: HTMLElement
  listEl: HTMLElement
  statusEl: HTMLElement
}

const DEFAULT_FIELDS: SuggestionField[] = [
  { id: "nextSteps", label: "Next Steps" },
  { id: "keyOutcomes", label: "Key Outcomes" },
  { id: "intent", label: "Engagement Purpose" }
]

function buildUI(root: HTMLElement): FieldPickerElements {
  const card = document.createElement("div")
  card.className = "card"
  card.id = "mcp-ui-field-picker"

  const title = document.createElement("div")
  title.className = "label"
  title.textContent = "Choose a Field"

  const list = document.createElement("div")
  list.className = "field-list"

  const status = document.createElement("div")
  status.className = "status"

  card.append(title, list, status)
  root.replaceChildren(card)

  return { root, listEl: list, statusEl: status }
}

export function createFieldPickerUI(
  root: HTMLElement,
  onSelect?: (field: SuggestionField) => void
): FieldPickerUI {
  let elements: FieldPickerElements | null = null

  function ensureElements() {
    if (!elements) {
      elements = buildUI(root)
    }
    return elements
  }

  function postSelection(field: SuggestionField) {
    const el = ensureElements()
    const payload = {
      type: "anet.selectSuggestionField",
      fieldId: field.id,
      fieldLabel: field.label,
      source: "mcp-app"
    }

    try {
      if (!window.top || window.top === window) {
        throw new Error("Missing top window")
      }
      window.top.postMessage(payload, "*")
    } catch {
      el.statusEl.textContent = "Failed to select field"
      return
    }

    el.statusEl.textContent = `${field.label} selected`
    onSelect?.(field)
  }

  function render(fields?: SuggestionField[]) {
    const el = ensureElements()
    const list = fields?.length ? fields : DEFAULT_FIELDS
    el.listEl.replaceChildren()
    el.statusEl.textContent = ""
    list.forEach(field => {
      const button = document.createElement("button")
      button.className = "field-button"
      button.type = "button"
      button.textContent = field.label
      button.addEventListener("click", () => postSelection(field))
      el.listEl.append(button)
    })
  }

  return { render }
}

export function normalizeFieldPickerArgs(args: unknown): SuggestionField[] | null {
  if (!args || typeof args !== "object") return null
  const record = args as Record<string, unknown>
  const rawFields = record.fields
  if (Array.isArray(rawFields)) {
    return rawFields as SuggestionField[]
  }
  if (typeof rawFields === "string") {
    try {
      const parsed = JSON.parse(rawFields)
      if (Array.isArray(parsed)) {
        return parsed as SuggestionField[]
      }
    } catch {
      return null
    }
  }
  return null
}

export function renderFieldPickerFromArgs(
  ui: FieldPickerUI,
  args: unknown,
  onError?: (message: string) => void
) {
  const fields = normalizeFieldPickerArgs(args)
  if (!fields) {
    onError?.("Tool input missing fields.")
    return
  }
  ui.render(fields)
}
