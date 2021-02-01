import Report from "low-side/models/Report"
import ReportForm from "low-side/pages/report/Form"
import React from "react"
import uuidv4 from "uuid/v4"

const NewReport = () => {
  const report = new Report({ uuid: uuidv4() })
  return (
    <div>
      <ReportForm title="Create a new report" initialValues={report} />
    </div>
  )
}

export default NewReport
