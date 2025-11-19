import Messages from "components/Messages"
import React, { useState } from "react"
import { Button, Container, FormGroup, Modal } from "react-bootstrap"

interface OptionListModalProps {
  title: string
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
  children?: React.ReactNode
}

const OptionListModal = ({
  title,
  showModal,
  onCancel,
  onSuccess,
  children
}: OptionListModalProps) => {
  const [error, setError] = useState(null)
  const [value, setValue] = useState("")

  return (
    <Modal backdrop="static" centered show={showModal} onHide={onCancel}>
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

      <Modal.Footer className="justify-content-between">
        <Button variant="outline-secondary" onClick={onCancel}>
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

export default OptionListModal
