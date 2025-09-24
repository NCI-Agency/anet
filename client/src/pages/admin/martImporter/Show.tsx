import { usePageTitle } from "components/Page"
import MartImportedReportTable from "pages/admin/martImporter/MartImportedReportTable"
import ReportHistoryModal from "pages/admin/martImporter/ReportHistoryModal"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { toast } from "react-toastify"

const MartImporterShow = () => {
  usePageTitle("MART reports imported")
  const [selectedMartImportedReport, setSelectedMartImportedReport] =
    useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  return (
    <>
      <Button variant="primary" onClick={handleExport}>
        Export Dictionary for MART
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
  async function handleExport() {
    try {
      const response = await fetch("/api/admin/dictionary/mart", {
        method: "GET",
        headers: {
          Accept: "application/x-yaml"
        }
      })
      if (!response.ok) {
        // Error happened in back-end producing dictionary, notify and end
        const errorJson = await response.json()
        toast.error(errorJson?.errors?.[0]?.message)
        return
      }
      // All good, proceed
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "anet-dictionary.yml"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(`Unexpected error during MART dictionary export "${err}"`)
    }
  }
}

export default MartImporterShow
