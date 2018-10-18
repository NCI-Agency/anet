import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Table } from 'react-bootstrap'
import _isEqual from 'lodash/isEqual'
import pluralize from 'pluralize'
import AdvisorReportsModal from 'components/AdvisorReports/AdvisorReportsModal'
import AdvisorReportsRow from 'components/AdvisorReports/AdvisorReportsRow'
import AdvisorReportsTableHead from 'components/AdvisorReports/AdvisorReportsTableHead'
import Settings from 'Settings'
import './OrganizationAdvisorsTable.css'

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
        let data = this.state.data.slice()
        data[index].selected =  this.toggleRowSelection(index)
        this.setState({ data: data })
        this.handleSelectRowData(this.state.data)
    }

    handleSelectAllRows() {
        let toggleSelect = !this.state.selectedAll
        let rows =  this.toggleSelectAllRows(toggleSelect)
        this.setState({
            data: rows,
            selectedAll: toggleSelect 
        })
        this.handleSelectRowData(this.state.data)
    }

    handleSelectRowData() {
        let selectedData = this.state.data.filter( (row) => { return row.selected } )
        this.props.onRowSelection(selectedData)
    }

    toggleRowSelection(index) {
        let isRowSelected = this.state.data[index].selected
        return !isRowSelected
    }

    toggleSelectAllRows(selected) {
        let rows = this.state.data.slice()
        rows.forEach( (item) => {
            item.selected = selected
        })
        return rows
    }

    search(rows, filterText) {
        let nothingFound = <tr className="nothing-found"><td colSpan="8">No organizations found...</td></tr>
        let search = rows.filter( (element) => {
            let props = element.props.row
            let orgName = props.name.toLowerCase()
            return orgName.indexOf( filterText.toLowerCase() ) !== -1
        })
        return ( search.length > 0 ) ? search : nothingFound
    }

    createAdvisorReportsRows(data) {
        return data.map( (organization, index) => {
            let checked = (organization.selected === undefined) ? false : organization.selected
            let modalLink = <AdvisorReportsModal 
                                name={ organization.name }
                                id={ organization.id }
                                columnGroups={ this.props.columnGroups } />

            return <AdvisorReportsRow
                        link={ modalLink }
                        row={ organization }
                        columnGroups={ this.props.columnGroups }
                        checked={ checked }
                        handleOrganizationClick={ () => this.handleOrganizationClick(index) }
                        onSelectRow={ () => this.handleSelectRow(index) }
                        key={ index } />
        })
    }

    render() {
        let rows = this.createAdvisorReportsRows(this.state.data)
        let showRows = (this.props.filterText) ? this.search(rows, this.props.filterText) : rows
        return(
            <div className="organization-advisors-table">
                <Table striped bordered condensed hover responsive>
                    <caption>Shows reports submitted and engagements attended per week by an organization's {pluralize(Settings.fields.advisor.person.name)}</caption>
                    <AdvisorReportsTableHead
                        columnGroups={ this.props.columnGroups }
                        title="Organization name" 
                        onSelectAllRows={ this.handleSelectAllRows } />
                    <tbody>
                        { showRows }
                    </tbody>
                </Table>
            </div>
        )
    }
}

OrganizationAdvisorsTable.propTypes = {
    columnGroups: PropTypes.array.isRequired,
    filterText: PropTypes.string,
    onRowSelection: PropTypes.func,
}

export default OrganizationAdvisorsTable
