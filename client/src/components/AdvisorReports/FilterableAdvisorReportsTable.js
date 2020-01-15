import API from "api"
import { gql } from "apollo-boost"
import OrganizationAdvisorsTable from "components/AdvisorReports/OrganizationAdvisorsTable"
import Toolbar from "components/AdvisorReports/Toolbar"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
import _debounce from "lodash/debounce"
import moment from "moment"
import React, { useState } from "react"
import { connect } from "react-redux"

const GQL_GET_ADVISOR_REPORTS_INSIGHT = gql`
  query {
    advisorReportInsights {
      uuid
      name
      stats {
        week
        nrReportsSubmitted
        nrEngagementsAttended
      }
    }
  }
`

const DEFAULT_WEEKS_AGO = 3

const FilterableAdvisorReportsTable = props => {
  const [filterText, setFilterText] = useState("")
  const [selectedData, setSelectedData] = useState([])
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_ADVISOR_REPORTS_INSIGHT
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const advisorReportInsights = data.advisorReportInsights
  const handleFilterTextInput = _debounce(setFilterText, 300)
  const columnGroups = getWeekColumns()

  return (
    <div>
      <Toolbar
        onFilterTextInput={handleFilterTextInput}
        onExportButtonClick={handleExportButtonClick}
      />
      <OrganizationAdvisorsTable
        data={advisorReportInsights}
        columnGroups={columnGroups}
        filterText={filterText}
        onRowSelection={handleRowSelection}
      />
    </div>
  )

  function handleExportButtonClick() {
    const exportData =
      selectedData.length > 0 ? selectedData : advisorReportInsights
    downloadCSV({ data: exportData })
  }

  function handleRowSelection(data) {
    setSelectedData(data)
  }

  function getWeekColumns() {
    const dateEnd = moment().startOf("week")
    const dateStart = moment()
      .startOf("week")
      .subtract(DEFAULT_WEEKS_AGO, "weeks")
    let currentDate = dateStart
    const weekColumns = []
    while (currentDate.isBefore(dateEnd)) {
      weekColumns.push(currentDate.week())
      currentDate = currentDate.add(1, "weeks")
    }
    return weekColumns
  }

  function convertArrayOfObjectsToCSV(args) {
    const data = args.data || null
    if (data === null || !data.length) {
      return null
    }

    const columnDelimiter = args.columnDelimiter || ","
    const lineDelimiter = args.lineDelimiter || "\n"

    const weekColumns = getWeekColumns()
    const csvGroupCols = [""]
    weekColumns.forEach(column => {
      csvGroupCols.push(column)
      csvGroupCols.push("")
    })

    let result = ""
    result += csvGroupCols.join(columnDelimiter)
    result += lineDelimiter

    const csvCols = ["Organization name"]
    weekColumns.forEach(column => {
      csvCols.push("Reports submitted")
      csvCols.push("Engagements attended")
    })

    result += csvCols.join(columnDelimiter)
    result += lineDelimiter

    data.forEach(item => {
      const stats = item.stats
      result += item.name
      weekColumns.forEach((column, index) => {
        result += columnDelimiter

        if (stats[index]) {
          result += stats[index].nrReportsSubmitted
          result += columnDelimiter
          result += stats[index].nrEngagementsAttended
        } else {
          result += "0,0"
        }
      })
      result += lineDelimiter
    })
    return result
  }

  function downloadCSV(args) {
    const csv = convertArrayOfObjectsToCSV({
      data: args.data
    })
    if (csv === null) return

    const filename = args.filename || "export-advisor-report.csv"
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })

    if (navigator.msSaveBlob) {
      // IE 10+
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
}

export default connect(null, mapDispatchToProps)(FilterableAdvisorReportsTable)
