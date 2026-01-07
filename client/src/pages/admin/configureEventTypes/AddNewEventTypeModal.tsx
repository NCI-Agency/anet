import * as FieldHelper from "components/FieldHelper"
import { Field, Form, Formik } from "formik"
import React from "react"
import { Button, Modal } from "react-bootstrap"

interface AddNewEventTypeModalProps {
  show: boolean
  onHide: () => void
  onSave: (values: any) => void
  validateCode: (code: string) => boolean
}

const AddNewEventTypeModal = ({
  show,
  onHide,
  onSave,
  validateCode
}: AddNewEventTypeModalProps) => {
  return (
    <Modal backdrop="static" centered show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Event Type</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Formik
          enableReinitialize
          initialValues={{
            code: ""
          }}
          validate={values => {
            const errors: { code?: string } = {}
            const code = values.code?.toUpperCase()
            if (code && !validateCode(code)) {
              errors.code = "Code already exists"
            }
            return errors
          }}
          onSubmit={values => {
            if (onSave) {
              onSave(values)
            }
            onHide()
          }}
        >
          {({ values, setFieldValue, setFieldTouched, errors }) => (
            <Form className="d-flex flex-column gap-3">
              <Field
                name="code"
                component={FieldHelper.InputField}
                placeholder="Give this event type a code"
                vertical
                onChange={e => {
                  const sanitized = e.target.value?.replace(/[^a-zA-Z_ ]+/g, "")
                  const parsedCode = sanitized
                    ?.toUpperCase()
                    .replace(/\s+/g, "_")
                  setFieldValue("code", parsedCode)
                  setFieldTouched("code", true, false)
                }}
              />
              <div className="submit-buttons">
                <div>
                  <Button
                    id="saveSearchModalSubmitButton"
                    variant="primary"
                    onClick={() => onSave(values)}
                    disabled={!!errors.code || !values.code}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  )
}

export default AddNewEventTypeModal
