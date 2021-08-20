import Messages from "components/Messages"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Container, FormGroup, Modal } from "react-bootstrap"

const OptionListModal = ({
  title,
  showModal,
  onCancel,
  onSuccess,
  children
}) => {
  const [error, setError] = useState(null)
  const [value, setValue] = useState("")

  return (
    <Modal
      className="send-modal-under-searchbar"
      show={showModal}
      onHide={onCancel}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Container fluid>
          <Messages error={error} />
          <FormGroup
            onChange={e => {
              setValue(e.target.value)
              setError(null)
            }}
          >
            {children}
          </FormGroup>
        </Container>
      </Modal.Body>

      <Modal.Footer>
        <Button
          className="float-start"
          variant="outline-secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button className="save-button" onClick={save} variant="primary">
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function save() {
    if (!value) {
      setError({ statusText: "Required", message: "please select an option" })
      return
    }
    // allow caller to do something useful with value
    onSuccess(value)
  }
}
OptionListModal.propTypes = {
  title: PropTypes.string.isRequired,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  children: PropTypes.node
}

export default OptionListModal
