import Messages from "components/Messages"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, FormGroup, Grid, Modal } from "react-bootstrap"

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
    <Modal show={showModal} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Grid fluid>
          <Messages error={error} />
          <FormGroup onChange={handleChange}>{children}</FormGroup>
        </Grid>
      </Modal.Body>

      <Modal.Footer>
        <Button className="pull-left" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="save-button" onClick={save} bsStyle="primary">
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )

  function handleChange(e) {
    setValue(e.target.value)
    setError(null)
  }

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
