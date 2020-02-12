import { Settings } from "api"
import AdvisorReportsModal from "components/AdvisorReports/AdvisorReportsModal"
import AdvisorReportsRow from "components/AdvisorReports/AdvisorReportsRow"
import AdvisorReportsTableHead from "components/AdvisorReports/AdvisorReportsTableHead"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Table } from "react-bootstrap"
import "./OrganizationAdvisorsTable.css"

class OrganizationAdvisorsTable extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: props.data || [],
      selectedAll: false
    }
    this.handleSelectRow = this.handleSelectRow.bind(this)
    this.handleSelectAllRows = this.handleSelectAllRows.bind(this)
  }

  handleSelectRow(index) {
    const data = this.state.data.slice()
    data[index].selected = this.toggleRowSelection(index)
    this.setState({ data: data })
    this.handleSelectRowData(this.state.data)
  }

  handleSelectAllRows() {
    const toggleSelect = !this.state.selectedAll
    const rows = this.toggleSelectAllRows(toggleSelect)
    this.setState({
      data: rows,
      selectedAll: toggleSelect
    })
    this.handleSelectRowData(this.state.data)
  }

  handleSelectRowData() {
    const selectedData = this.state.data.filter(row => {
      return row.selected
    })
    this.props.onRowSelection(selectedData)
  }

  toggleRowSelection(index) {
    const isRowSelected = this.state.data[index].selected
    return !isRowSelected
  }

  toggleSelectAllRows(selected) {
    const rows = this.state.data.slice()
    rows.forEach(item => {
      item.selected = selected
    })
    return rows
  }

  search(rows, filterText) {
    const nothingFound = (
      <tr className="nothing-found">
        <td colSpan="8">No organizations found...</td>
      </tr>
    )
    const search = rows.filter(element => {
      const props = element.props.row
      const orgName = props.name.toLowerCase()
      return orgName.indexOf(filterText.toLowerCase()) !== -1
    })
    return search.length > 0 ? search : nothingFound
  }

  createAdvisorReportsRows(data) {
    return data.map((organization, index) => {
      const checked =
        organization.selected === undefined ? false : organization.selected
      const modalLink = (
        <AdvisorReportsModal
          name={organization.name}
          uuid={organization.uuid}
          columnGroups={this.props.columnGroups}
        />
      )

      return (
        <AdvisorReportsRow
          link={modalLink}
          row={organization}
          columnGroups={this.props.columnGroups}
          checked={checked}
          handleOrganizationClick={() => this.handleOrganizationClick(index)}
          onSelectRow={() => this.handleSelectRow(index)}
          key={index}
        />
      )
    })
  }

  render() {
    const rows = this.createAdvisorReportsRows(this.state.data)
    const showRows = this.props.filterText
      ? this.search(rows, this.props.filterText)
      : rows
    return (
      <div className="organization-advisors-table">
        <Table striped bordered condensed hover responsive>
          <caption>
            Shows reports submitted and engagements attended per week by an
            organization's {pluralize(Settings.fields.advisor.person.name)}
          </caption>
          <AdvisorReportsTableHead
            columnGroups={this.props.columnGroups}
            title="Organization name"
            onSelectAllRows={this.handleSelectAllRows}
          />
          <tbody>{showRows}</tbody>
        </Table>
      </div>
    )
  }
}

OrganizationAdvisorsTable.propTypes = {
  data: PropTypes.array,
  columnGroups: PropTypes.array.isRequired,
  filterText: PropTypes.string,
  onRowSelection: PropTypes.func
}
OrganizationAdvisorsTable.defaultProps = {
  data: []
}
export default OrganizationAdvisorsTable
