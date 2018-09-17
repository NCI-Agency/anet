import PropTypes from 'prop-types'
import React, { Component } from 'react'
import OrganizationAdvisorsTable from 'components/AdvisorReports/OrganizationAdvisorsTable'
import Toolbar from 'components/AdvisorReports/Toolbar'
import _debounce from 'lodash/debounce'
import moment from 'moment'

import API from 'api'

import { connect } from 'react-redux'
import LoaderHOC, {mapDispatchToProps} from 'HOC/LoaderHOC'

const DEFAULT_WEEKS_AGO = 3
const OrganizationAdvisorsTableWithLoader = connect(null, mapDispatchToProps)(LoaderHOC('isLoading')('data')(OrganizationAdvisorsTable))

class FilterableAdvisorReportsTable extends Component {
    static propTypes = {
        date: PropTypes.object,
        showLoading: PropTypes.func.isRequired,
        hideLoading: PropTypes.func.isRequired,
    }

    constructor() {
        super()
        this.state = {
            filterText: '',
            export: false,
            data: [],
            isLoading: false,
            selectedData: []
        }
        this.handleFilterTextInput = this.handleFilterTextInput.bind(this)
        this.handleExportButtonClick = this.handleExportButtonClick.bind(this)
        this.handleRowSelection = this.handleRowSelection.bind(this)
    }

    componentDidMount() {
      this.setState( {isLoading: true} )
      this.props.showLoading()
      API.query(/* GraphQL */`advisorReportInsights { id name stats { week nrReportsSubmitted nrEngagementsAttended }}`)
        .then(data => {
          this.setState({
              isLoading: false,
              data: data.advisorReportInsights
          })
          this.props.hideLoading()
      })
  }

    handleFilterTextInput(filterText) {
        this.setState({ filterText: filterText })
    }

    handleExportButtonClick() {
        let selectedData = this.state.selectedData
        let allData = this.state.data
        let exportData = (selectedData.length > 0) ? selectedData : allData
        this.downloadCSV( { data: exportData } )
    }

    handleRowSelection(data) {
        this.setState({ selectedData: data })
    }

    getWeekColumns() {
        const dateEnd = moment().startOf('week')
        const dateStart = moment().startOf('week').subtract(DEFAULT_WEEKS_AGO, 'weeks')
        let currentDate = dateStart
        let weekColumns = []
        while(currentDate.isBefore(dateEnd)) {
            weekColumns.push(currentDate.week())
            currentDate = currentDate.add(1, 'weeks')
        }
        return weekColumns
    }

    convertArrayOfObjectsToCSV(args) {
        let result, csvGroupCols, csvCols, columnDelimiter, lineDelimiter, data

        data = args.data || null
        if (data == null || !data.length) {
            return null
        }

        columnDelimiter = args.columnDelimiter || ','
        lineDelimiter = args.lineDelimiter || '\n'

        let weekColumns = this.getWeekColumns()
        csvGroupCols = ['']
        weekColumns.forEach( (column) => {
            csvGroupCols.push(column)
            csvGroupCols.push('')
        })

        result = ''
        result += csvGroupCols.join(columnDelimiter)
        result += lineDelimiter

        csvCols = ['Organization name']
        weekColumns.forEach( (column) => {
            csvCols.push('Reports submitted')
            csvCols.push('Engagements attended')
        })

        result += csvCols.join(columnDelimiter)
        result += lineDelimiter

        data.forEach( (item) => {
            let stats = item.stats
            result += item.name
            weekColumns.forEach( (column, index) => {
                result += columnDelimiter

                if (stats[index]) {
                    result += stats[index].nrReportsSubmitted
                    result += columnDelimiter
                    result += stats[index].nrEngagementsAttended
                } else {
                    result += '0,0'
                }
            })
            result += lineDelimiter
        })
        return result
    }

    downloadCSV(args) {
        let filename
        let csv = this.convertArrayOfObjectsToCSV({
            data: args.data
        })
        if (csv == null) return

        filename = args.filename || 'export-advisor-report.csv'
        var blob = new Blob([csv], {type: "text/csv;charset=utf-8;"})

        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename)
        } else {
            var link = document.createElement("a")
            if (link.download !== undefined) {
                // feature detection, Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob)
                link.setAttribute("href", url)
                link.setAttribute("download", filename)
                link.style = "visibility:hidden"
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
        }
    }

    render() {
        const handleFilterTextInput = _debounce( (filterText) => {this.handleFilterTextInput(filterText) }, 300)
        const columnGroups = this.getWeekColumns()
        return (
            <div>
                <Toolbar 
                    onFilterTextInput={ handleFilterTextInput }
                    onExportButtonClick={ this.handleExportButtonClick } />
                <OrganizationAdvisorsTableWithLoader
                    data={ this.state.data }
                    columnGroups={ columnGroups }
                    filterText={ this.state.filterText }
                    onRowSelection={ this.handleRowSelection }
                    isLoading={ this.state.isLoading } />
            </div>
        )
    }
}

export default connect(null, mapDispatchToProps)(FilterableAdvisorReportsTable)
