import Checkbox from "components/Checkbox"
import _uniqueId from "lodash/uniqueId"
import PropTypes from "prop-types"
import React from "react"

const _advisorStats = (columnGroups, statistics) => {
  let stats = []
  columnGroups.forEach(group => {
    let rowCell = statistics.filter(s => s.week === group)
    rowCell = rowCell ? rowCell[0] : null
    let keySubmitted = _uniqueId("submitted_")
    let keyAttended = _uniqueId("attended_")
    if (rowCell) {
      stats.push(<td key={keySubmitted}>{rowCell.nrReportsSubmitted}</td>)
      stats.push(<td key={keyAttended}>{rowCell.nrEngagementsAttended}</td>)
    } else {
      stats.push(<td key={keySubmitted}>0</td>)
      stats.push(<td key={keyAttended}>0</td>)
    }
  })
  return stats
}

const AdvisorReportsRow = props => {
  let statistics = _advisorStats(props.columnGroups, props.row.stats)
  let checkbox = props.onSelectRow ? (
    <td>
      <Checkbox checked={props.checked} onChange={props.onSelectRow} />
    </td>
  ) : null
  let description = props.handleOrganizationClick ? props.link : props.row.name
  return (
    <tr>
      {checkbox}
      <td>{description}</td>
      {statistics}
    </tr>
  )
}

AdvisorReportsRow.propTypes = {
  checked: PropTypes.bool,
  columnGroups: PropTypes.array,
  handleOrganizationClick: PropTypes.bool,
  link: PropTypes.object,
  onSelectRow: PropTypes.func,
  row: PropTypes.object
}

export default AdvisorReportsRow
