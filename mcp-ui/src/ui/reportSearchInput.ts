type SearchInputArgs = {
  placeholder?: string
  defaultQuery?: string
  businessObject?: unknown
}

export type SearchSubmitFn = (
  query: string,
  businessObject: unknown
) => Promise<void>

type SearchInputUI = {
  render: (args: unknown) => void
}

type SearchInputElements = {
  root: HTMLElement
  card: HTMLElement
  textarea: HTMLTextAreaElement
  searchBtn: HTMLButtonElement
  statusEl: HTMLElement
}

const DEFAULT_PLACEHOLDER =
  "e.g. reports about supply chain issues with Org X last quarter"

function buildUI(root: HTMLElement, onSubmit: () => void): SearchInputElements {
  const card = document.createElement("div")
  card.className = "card"
  card.id = "mcp-ui-report-search-input"

  const title = document.createElement("div")
  title.className = "label"
  title.textContent = "Search Reports"

  const description = document.createElement("div")
  description.className = "description"
  description.textContent =
    "Describe what you're looking for in plain language — topics, people, " +
    "organizations, time ranges, or anything else."

  const textarea = document.createElement("textarea")
  textarea.rows = 4
  textarea.placeholder = DEFAULT_PLACEHOLDER
  textarea.addEventListener("keydown", event => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onSubmit()
    }
  })

  const actions = document.createElement("div")
  actions.className = "actions"

  const searchBtn = document.createElement("button")
  searchBtn.type = "button"
  searchBtn.className = "primary"
  searchBtn.textContent = "Search"
  searchBtn.addEventListener("click", onSubmit)

  const status = document.createElement("div")
  status.className = "status"

  actions.append(searchBtn)
  card.append(title, description, textarea, actions, status)
  root.replaceChildren(card)

  return { root, card, textarea, searchBtn, statusEl: status }
}

function normalizeArgs(args: unknown): SearchInputArgs {
  if (!args || typeof args !== "object") return {}
  const r = args as Record<string, unknown>
  return {
    placeholder: typeof r.placeholder === "string" ? r.placeholder : undefined,
    defaultQuery:
      typeof r.defaultQuery === "string" ? r.defaultQuery : undefined,
    businessObject: r.businessObject
  }
}

export function createReportSearchInputUI(
  root: HTMLElement,
  onSubmit: SearchSubmitFn
): SearchInputUI {
  let elements: SearchInputElements | null = null
  let cachedBusinessObject: unknown = undefined

  async function handleSubmit() {
    const el = ensureElements()
    const query = el.textarea.value.trim()
    if (!query) {
      el.statusEl.textContent = "Please enter a search query."
      return
    }

    el.searchBtn.disabled = true
    el.statusEl.textContent = "Searching…"
    try {
      await onSubmit(query, cachedBusinessObject)
      el.statusEl.textContent = ""
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Search request failed."
      el.statusEl.textContent = message
    } finally {
      el.searchBtn.disabled = false
    }
  }

  function ensureElements() {
    if (!elements) {
      elements = buildUI(root, () => void handleSubmit())
    }
    return elements
  }

  function render(args: unknown) {
    const el = ensureElements()
    // Re-attach in case another UI (e.g. results) replaced us in the DOM.
    if (el.card.parentElement !== root) {
      root.replaceChildren(el.card)
    }
    const parsed = normalizeArgs(args)
    cachedBusinessObject = parsed.businessObject

    if (parsed.placeholder) {
      el.textarea.placeholder = parsed.placeholder
    }
    if (parsed.defaultQuery && !el.textarea.value) {
      el.textarea.value = parsed.defaultQuery
    }
    el.statusEl.textContent = ""
    el.searchBtn.disabled = false

    setTimeout(() => el.textarea.focus(), 0)
  }

  return { render }
}
