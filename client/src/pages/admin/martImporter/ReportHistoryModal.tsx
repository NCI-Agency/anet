import MartImportedReportTable from "pages/admin/martImporter/MartImportedReportTable"
import React from "react"
import { Button, Modal } from "react-bootstrap"

interface ReportHistoryModalProps {
  martImportedReport: any
  pageDispatchers: any
  onCancel?: (...args: unknown[]) => unknown
}

const ReportHistoryModal = ({
  martImportedReport,
  pageDispatchers,
  onCancel
}: ReportHistoryModalProps) => {
  return (
    <Modal centered show onHide={onCancel} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>{martImportedReport.report.intent}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <MartImportedReportTable
          selectedReportUuid={martImportedReport.report.uuid}
          pageDispatchers={pageDispatchers}
        />
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button onClick={onCancel} variant="outline-secondary">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ReportHistoryModal
