import React, { useMemo } from "react"
import { Button } from "react-bootstrap"

type ExportPref = {
  uuid: string
  name: string
  allowedValues?: string
  defaultValue?: string
}

const splitCsv = v => {
  if (!v) {
    return []
  }
  return v
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
}

interface ExportFieldsPanelProps {
  pref: ExportPref
  values: Record<string, any>
  initialSnapshot: Record<string, any>
  setFieldValue: (field: string, value: any) => void
  titleForExportPref: (name: string) => string
  getLabelFromDictionary: (preferenceName: string, field: string) => string
}

const ExportFieldsPanel = ({
  pref,
  values,
  initialSnapshot,
  setFieldValue,
  titleForExportPref,
  getLabelFromDictionary
}: ExportFieldsPanelProps) => {
  const preferenceName = pref.name

  const allValues = useMemo(
    () => splitCsv(pref.allowedValues),
    [pref.allowedValues]
  )

  const selected = splitCsv(values?.[pref.uuid])
  const initialSelected = splitCsv(initialSnapshot?.[pref.uuid])

  const setSelected = arr => {
    setFieldValue(pref.uuid, arr.join(","))
  }
  const toggle = v => {
    const has = selected.includes(v)
    setSelected(has ? selected.filter(x => x !== v) : [...selected, v])
  }

  const selectAll = () => setSelected(allValues)
  const clearAll = () => setSelected([])
  const reset = () => setSelected(initialSelected)

  const labelFor = v => {
    return getLabelFromDictionary(preferenceName, v)
  }

  return (
    <div className="card mb-3">
      <div
        className="card-header d-flex justify-content-between align-items-center"
        style={{ backgroundColor: "#f2f2f2" }}
      >
        <strong>{titleForExportPref(preferenceName)}</strong>
        <div className="d-flex gap-2 align-items-center">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={selectAll}
            type="button"
          >
            Select all
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={clearAll}
            type="button"
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={reset}
            type="button"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="card-body">
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-2">
          {allValues.map(v => (
            <div className="col" key={v}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  id={`${pref.uuid}-${v}`}
                  type="checkbox"
                  checked={selected.includes(v)}
                  onChange={() => toggle(v)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`${pref.uuid}-${v}`}
                >
                  {labelFor(v)}
                </label>
              </div>
            </div>
          ))}
          {allValues.length === 0 && (
            <div className="text-muted small">No fields available</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(ExportFieldsPanel)
