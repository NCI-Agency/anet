import React from "react"
import { Button } from "react-bootstrap"

interface ToolbarProps {
  onFilterTextInput: (...args: unknown[]) => unknown
  onExportButtonClick: (...args: unknown[]) => unknown
}

const Toolbar = ({ onFilterTextInput, onExportButtonClick }: ToolbarProps) => (
  <form className="advisor-reports-form">
    <div className="row">
      <div className="col-sm-8">
        <label className="visually-hidden" htmlFor="advisorSearch">
          Search organizations
        </label>
        <input
          className="form-control"
          id="advisorSearch"
          type="text"
          placeholder="Search organizations…"
          onChange={e => onFilterTextInput(e.target.value)}
        />
      </div>
      <div className="col-sm-2">
        <Button onClick={onExportButtonClick} variant="outline-secondary">
          Export to CSV
        </Button>
      </div>
    </div>
  </form>
)

export default Toolbar
