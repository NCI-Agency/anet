import { Form, Formik } from "formik"
import { getOverlappingPeriodIndexes } from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

function EditHistory({ history1, history2, setHistory }) {
  const [finalHistory, setFinalHistory] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const overlaps = getOverlappingDateIndexes(history1, history2)

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Edit History Manually</button>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Save search</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            enableReinitialize
            onSubmit={setHistory}
            initialValues={{ name: "" }}
          >
            {({ values, submitForm }) => (
              <Form>
                <div className="submit-buttons">
                  <div>
                    <Button
                      id="saveSearchModalSubmitButton"
                      bsStyle="primary"
                      type="button"
                      onClick={submitForm}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </div>
  )
}

EditHistory.propTypes = {
  history1: PropTypes.array,
  history2: PropTypes.array,
  setHistory: PropTypes.func
}

export default EditHistory

// Returns indexes of the overlapping items
function getOverlappingDateIndexes(history1, history2) {
  // one of them falsy, we don't have overlapping
  if (!history1 || !history2) {
    return null
  }

  return getOverlappingPeriodIndexes(history1, history2)
}
