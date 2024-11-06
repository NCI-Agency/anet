import Checkbox from "components/Checkbox"
import React from "react"

const _advisorStats = (columnGroups, statistics) => {
  const stats = []
  columnGroups.forEach(group => {
    let rowCell = statistics.filter(s => s.week === group)
    rowCell = rowCell ? rowCell[0] : null
    if (rowCell) {
      stats.push(
        <td key={`submitted_${group}`}>{rowCell.nrReportsSubmitted}</td>
      )
      stats.push(
        <td key={`attended_${group}`}>{rowCell.nrEngagementsAttended}</td>
      )
    } else {
      stats.push(<td key={`submitted_${group}`}>0</td>)
      stats.push(<td key={`attended_${group}`}>0</td>)
    }
  })
  return stats
}

interface AdvisorReportsRowProps {
  checked?: boolean
  columnGroups?: number[]
  withOrganizationLink?: boolean
  link?: any
  onSelectRow?: (...args: unknown[]) => unknown
  row?: any
}

const AdvisorReportsRow = (props: AdvisorReportsRowProps) => {
  const statistics = _advisorStats(props.columnGroups, props.row.stats)
  const checkbox = props.onSelectRow ? (
    <td>
      <Checkbox checked={props.checked} onChange={props.onSelectRow} />
    </td>
  ) : null
  const description = props.withOrganizationLink ? props.link : props.row.name
  return (
    <tr>
      {checkbox}
      <td>{description}</td>
      {statistics}
    </tr>
  )
}

export default AdvisorReportsRow
