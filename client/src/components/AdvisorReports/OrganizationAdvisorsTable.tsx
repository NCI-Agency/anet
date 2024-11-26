import AdvisorReportsModal from "components/AdvisorReports/AdvisorReportsModal"
import AdvisorReportsRow from "components/AdvisorReports/AdvisorReportsRow"
import AdvisorReportsTableHead from "components/AdvisorReports/AdvisorReportsTableHead"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"
import "./OrganizationAdvisorsTable.css"

interface OrganizationAdvisorsTableProps {
  data?: any[]
  columnGroups: number[]
  filterText?: string
  onRowSelection?: (...args: unknown[]) => unknown
  weeksAgo?: number
}

const OrganizationAdvisorsTable = ({
  data: dataProp = [],
  filterText,
  columnGroups,
  onRowSelection,
  weeksAgo
}: OrganizationAdvisorsTableProps) => {
  const [data, setData] = useState(dataProp || [])
  const [selectedAll, setSelectedAll] = useState(false)

  const latestOnRowSelection = useRef(onRowSelection)

  const rows = useMemo(() => {
    const handleSelectRow = index => {
      const rows = data.slice()
      // Toggle row selection
      rows[index].selected = !data[index].selected
      setData(rows)
      const nrSelected = rows.reduce(
        (prev, curr) => (curr.selected ? prev + 1 : prev),
        0
      )
      if (nrSelected === 0) {
        setSelectedAll(false)
      } else if (nrSelected === rows.length) {
        setSelectedAll(true)
      } else {
        setSelectedAll(null) // return indeterminate if only some are selected
      }
    }
    return data.map((organization, index) => {
      const checked =
        organization.selected === undefined ? false : organization.selected
      const modalLink = (
        <AdvisorReportsModal
          name={organization.name}
          uuid={organization.uuid}
          columnGroups={columnGroups}
          weeksAgo={weeksAgo}
        />
      )
      return (
        <AdvisorReportsRow
          link={modalLink}
          row={organization}
          columnGroups={columnGroups}
          checked={checked}
          withOrganizationLink
          onSelectRow={() => handleSelectRow(index)}
          key={index}
        />
      )
    })
  }, [columnGroups, data, weeksAgo])

  useEffect(() => {
    latestOnRowSelection.current = onRowSelection
  }, [onRowSelection])

  useEffect(() => {
    const selectedData = data.filter(row => row.selected)
    latestOnRowSelection.current(selectedData)
  }, [data])

  const filteredRows = filterText ? filterRows(rows, filterText) : rows

  return (
    <div className="organization-advisors-table">
      <Table striped bordered hover responsive>
        <caption>
          Shows reports submitted and engagements attended per week for each{" "}
          {Settings.fields.advisor.person.name} in the organization
        </caption>
        <AdvisorReportsTableHead
          columnGroups={columnGroups}
          title="Organization name"
          selectAllRows={selectedAll}
          onSelectAllRows={handleSelectAllRows}
        />
        <tbody>{filteredRows}</tbody>
      </Table>
    </div>
  )

  function handleSelectAllRows() {
    const toggleSelect = !selectedAll
    // Toggle select all rows
    const rows = data.slice()
    rows.forEach(item => {
      item.selected = toggleSelect
    })
    setData(rows)
    setSelectedAll(toggleSelect)
  }

  function filterRows(rows, filterText) {
    const nothingFound = (
      <tr className="nothing-found">
        <td colSpan={8}>No organizations found…</td>
      </tr>
    )
    const filterResult = rows.filter(element => {
      const elemProps = element.props.row
      const orgName = elemProps.name.toLowerCase()
      return orgName.indexOf(filterText.toLowerCase()) !== -1
    })
    return filterResult.length > 0 ? filterResult : nothingFound
  }
}

export default OrganizationAdvisorsTable
