import Checkbox from "components/Checkbox"
import PropTypes from "prop-types"
import React from "react"

const AdvisorReportsTableHead = props => {
  const weekHeadings = []
  const weekCols = []

  props.columnGroups.forEach(week => {
    const keyWeek = `wk-${week}`
    const keySubmitted = `s-${week}`
    const keyAttended = `a-${week}`
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
