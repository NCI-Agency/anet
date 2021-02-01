import Fieldset from "low-side/components/Fieldset"
import Report from "low-side/models/Report"
import PropTypes from "prop-types"
import React from "react"
import { Link } from "react-router-dom"

const ReportList = ({ reports, title }) => {
  // sort reports, latest created at the top
  const sorted = reports.sort((a, b) => b.createdAt - a.createdAt)
  return (
    <Fieldset title={title}>
      {sorted.map((r, idx) => (
        <div key={r.uuid}>
          {idx + 1}){" "}
          <Link to={Report.pathFor(r)}>
            {r.description || `No description #${r.uuid}`}
          </Link>
        </div>
      ))}
    </Fieldset>
  )
}
ReportList.propTypes = {
  reports: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string
}
export default ReportList
