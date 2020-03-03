import { Settings } from "api"
import AdvisorReportsModal from "components/AdvisorReports/AdvisorReportsModal"
import AdvisorReportsRow from "components/AdvisorReports/AdvisorReportsRow"
import AdvisorReportsTableHead from "components/AdvisorReports/AdvisorReportsTableHead"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Table } from "react-bootstrap"
import "./OrganizationAdvisorsTable.css"

const OrganizationAdvisorsTable = ({
  data: dataProp,
  filterText,
  columnGroups,
  onRowSelection
}) => {
  const [data, setData] = useState(dataProp || [])
  const [selectedAll, setSelectedAll] = useState(false)

  const latestOnRowSelection = useRef(onRowSelection)

  const rows = useMemo(() => {
    const handleSelectRow = index => {
      const rows = data.slice()
      // Toggle row selection
      rows[index].selected = !data[index].selected
      setData(rows)
    }
    return data.map((organization, index) => {
      const checked =
        organization.selected === undefined ? false : organization.selected
      const modalLink = (
        <AdvisorReportsModal
          name={organization.name}
          uuid={organization.uuid}
          columnGroups={columnGroups}
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
  }, [columnGroups, data])

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
      <Table striped bordered condensed hover responsive>
        <caption>
          Shows reports submitted and engagements attended per week by an
          organization's {pluralize(Settings.fields.advisor.person.name)}
        </caption>
        <AdvisorReportsTableHead
          columnGroups={columnGroups}
          title="Organization name"
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
        <td colSpan="8">No organizations found...</td>
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
