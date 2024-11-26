import { gql } from "@apollo/client"
import API from "api"
import OrganizationAdvisorsTable from "components/AdvisorReports/OrganizationAdvisorsTable"
import Toolbar from "components/AdvisorReports/Toolbar"
import {
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import _debounce from "lodash/debounce"
import moment from "moment"
import React, { useState } from "react"
import Settings from "settings"

const GQL_GET_ADVISOR_REPORTS_INSIGHT = gql`
  query ($weeksAgo: Int) {
    advisorReportInsights(weeksAgo: $weeksAgo) {
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

interface FilterableAdvisorReportsTableProps {
  pageDispatchers?: PageDispatchersPropType
}

const FilterableAdvisorReportsTable = ({
  pageDispatchers
}: FilterableAdvisorReportsTableProps) => {
  const [filterText, setFilterText] = useState("")
  const [selectedData, setSelectedData] = useState([])
  const weeksAgo = DEFAULT_WEEKS_AGO // TODO: should be selectable by the user
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_ADVISOR_REPORTS_INSIGHT,
    {
      weeksAgo
    }
  )
  usePageTitle(`${Settings.fields.advisor.person.name} Reports`)
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
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
        weeksAgo={weeksAgo}
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
    const dateEnd = moment().startOf("week").add(1, "week")
    const dateStart = moment(dateEnd).subtract(weeksAgo, "weeks")
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
      weekColumns.forEach(column => {
        result += columnDelimiter
        const stat = stats.find(s => s?.week === column)
        result += `${stat?.nrReportsSubmitted ?? 0}${columnDelimiter}${
          stat?.nrEngagementsAttended ?? 0
        }`
      })
      result += lineDelimiter
    })
    return result
  }

  function downloadCSV(args) {
    const csv = convertArrayOfObjectsToCSV({
      data: args.data
    })
    if (csv === null) {
      return
    }

    const filename = args.filename || "export-advisor-report.csv"
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })

    const link = document.createElement("a")
    if (link.download !== undefined) {
      // feature detection, Browsers that support HTML5 download attribute
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style = "visibility:hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}

export default FilterableAdvisorReportsTable
