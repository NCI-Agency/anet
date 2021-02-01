import AppContext from "low-side/components/AppContext"
import Report from "low-side/models/Report"
import ReportForm from "low-side/pages/report/Form"
import React, { useContext } from "react"
import { useParams } from "react-router-dom"

const EditReport = () => {
  const { uuid } = useParams()
  const reportData = useContext(AppContext).reports.find(r => r.uuid === uuid)
  if (!reportData) {
    return null
  }

  const report = new Report(reportData)
  return (
    <div>
      <ReportForm title="Edit report" initialValues={report} isEdit />
    </div>
  )
}

export default EditReport
