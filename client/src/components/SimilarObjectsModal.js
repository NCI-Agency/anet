import React from "react"
import { Button, Modal } from "react-bootstrap"
import PropTypes from "prop-types"
import PositionTable from "components/PositionTable"
import PersonTable from "./PersonTable"
import LocationTable from "./LocationTable"

const DEFAULT_PAGESIZE = 10

const SimilarObjectsModal = ({ objectType, userInput, onCancel }) => {
  const queryParams = Object.assign({
    sortBy: "NAME",
    sortOrder: "ASC",
    pageNum: 0,
    pageSize: DEFAULT_PAGESIZE,
    text: userInput
  })

  return (
    <Modal show={true} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Possible Duplicates</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {objectType === "Person" && (
          <PersonTable queryParams={queryParams} id="similar-people-table" />
        )}
        {objectType === "Location" && (
          <LocationTable
            queryParams={queryParams}
            id="similar-locations-table"
          />
        )}
        {objectType === "Position" && (
          <PositionTable
            queryParams={queryParams}
            id="similar-positions-table"
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button className="pull-left" onClick={onCancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

SimilarObjectsModal.propTypes = {
  objectType: PropTypes.string,
  userInput: PropTypes.string,
  onCancel: PropTypes.func
}

export default SimilarObjectsModal
