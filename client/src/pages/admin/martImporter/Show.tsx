import { usePageTitle } from "components/Page"
import MartImportedReportTable from "pages/admin/martImporter/MartImportedReportTable"
import ReportHistoryModal from "pages/admin/martImporter/ReportHistoryModal"
import React, { useState } from "react"
import { Button } from "react-bootstrap"

const MartImporterShow = () => {
  usePageTitle("MART reports imported")
  const [selectedMartImportedReport, setSelectedMartImportedReport] =
    useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  return (
    <>
      <Button variant="primary">
        <a
          href="/api/admin/dictionary/mart"
          style={{
            color: "white",
            padding: "6px 12px",
            textDecoration: "none"
          }}
        >
          Export Dictionary for MART
        </a>
      </Button>
      <MartImportedReportTable onSelectReport={renderHistoryModal} />
      {showHistoryModal && (
        <ReportHistoryModal
          martImportedReport={selectedMartImportedReport}
          onCancel={() => {
            setShowHistoryModal(false)
          }}
        />
      )}
    </>
  )

  function renderHistoryModal(martImportedReport: any) {
    setSelectedMartImportedReport(martImportedReport)
    setShowHistoryModal(true)
  }
}

export default MartImporterShow
