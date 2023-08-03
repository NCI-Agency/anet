import LocationTable from "components/LocationTable"
import PersonTable from "components/PersonTable"
import PositionTable from "components/PositionTable"
import PropTypes from "prop-types"
import React from "react"
import { Button, Modal } from "react-bootstrap"

const DEFAULT_PAGESIZE = 10

const TABLE_COMPONENTS = {
  Location: LocationTable,
  Person: PersonTable,
  Position: PositionTable
}

const SimilarObjectsModal = ({ objectType, userInput, onCancel }) => {
  const queryParams = Object.assign({
    pageNum: 0,
    pageSize: DEFAULT_PAGESIZE,
    text: userInput
  })

  const TableComponent = TABLE_COMPONENTS[objectType]
  return !TableComponent ? null : (
    <Modal centered show onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Possible Duplicates</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <TableComponent queryParams={queryParams} />
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button onClick={onCancel} variant="outline-secondary">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

SimilarObjectsModal.propTypes = {
  objectType: PropTypes.string.isRequired,
  userInput: PropTypes.string.isRequired,
  onCancel: PropTypes.func
}

export default SimilarObjectsModal
