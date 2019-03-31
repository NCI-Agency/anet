import React, { Component } from "react"
import { Button } from "react-bootstrap"

class Toolbar extends Component {
  constructor(props) {
    super(props)
    this.handleFilterTextInputChange = this.handleFilterTextInputChange.bind(
      this
    )
    this.handleExportButtonClick = this.handleExportButtonClick.bind(this)
  }

  handleFilterTextInputChange(e) {
    this.props.onFilterTextInput(e.target.value)
  }

  handleExportButtonClick() {
    this.props.onExportButtonClick()
  }

  render() {
    return (
      <form className="advisor-reports-form">
        <div className="row">
          <div className="col-sm-8">
            <label className="sr-only" htmlFor="advisorSearch">
              Search organizations
            </label>
            <input
              className="form-control"
              id="advisorSearch"
              type="text"
              placeholder="Search organizations..."
              onChange={this.handleFilterTextInputChange}
            />
          </div>
          <div className="col-sm-2">
            <Button onClick={this.handleExportButtonClick}>
              Export to CSV
            </Button>
          </div>
        </div>
      </form>
    )
  }
}

export default Toolbar
