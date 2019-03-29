import Checkbox from "components/Checkbox"
import PropTypes from "prop-types"
import React from "react"

const AdvisorReportsTableHead = props => {
  let weekHeadings = []
  let weekCols = []

  props.columnGroups.forEach(week => {
    let keyWeek = `wk-${week}`
    let keySubmitted = `s-${week}`
    let keyAttended = `a-${week}`
    weekHeadings.push(
      <th colSpan="2" key={keyWeek}>
        Week {week}
      </th>
    )
    weekCols.push(<th key={keySubmitted}>Reports submitted</th>)
    weekCols.push(<th key={keyAttended}>Engagements attended</th>)
  })

  return (
    <thead>
      <tr key="advisor-heading">
        {props.onSelectAllRows && (
          <th rowSpan="2">
            <Checkbox onChange={props.onSelectAllRows} />
          </th>
        )}
        <th rowSpan="2">{props.title}</th>
        {weekHeadings}
      </tr>
      <tr key="week-columns">{weekCols}</tr>
    </thead>
  )
}

AdvisorReportsTableHead.propTypes = {
  title: PropTypes.string,
  columnGroups: PropTypes.array,
  onSelectAllRows: PropTypes.func
}

export default AdvisorReportsTableHead
