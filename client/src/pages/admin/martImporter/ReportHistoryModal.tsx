import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import MartImportedReportTable from "pages/admin/martImporter/MartImportedReportTable"
import React from "react"
import { Button, Modal } from "react-bootstrap"
import { connect } from "react-redux"

interface ReportHistoryModalProps {
  pageDispatchers?: PageDispatchersPropType
  martImportedReport: any
  onCancel?: (...args: unknown[]) => unknown
}

const ReportHistoryModal = ({
  martImportedReport,
  pageDispatchers,
  onCancel
}: ReportHistoryModalProps) => {
  return (
    <Modal backdrop="static" centered show onHide={onCancel} size="xl">
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

export default connect(null, mapPageDispatchersToProps)(ReportHistoryModal)
