import * as FieldHelper from "components/FieldHelper"
import { Field, Form, Formik } from "formik"
import React from "react"
import { Button, Modal } from "react-bootstrap"

interface AddNewEventTypeModalProps {
  show: boolean
  onHide: () => void
  onSave: (values: any) => void
  validateName: (name: string) => boolean
}

const AddNewEventTypeModal = ({
  show,
  onHide,
  onSave,
  validateName
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
            name: ""
          }}
          validate={values => {
            const errors: { name?: string } = {}
            const name = values.name
            if (name && !validateName(name)) {
              errors.name = "Name already exists"
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
          {({ values, errors }) => (
            <Form className="d-flex flex-column gap-3">
              <Field
                name="name"
                component={FieldHelper.InputField}
                placeholder="Give this event type a name"
                vertical
              />
              <div className="submit-buttons">
                <div>
                  <Button
                    id="saveSearchModalSubmitButton"
                    variant="primary"
                    onClick={() => onSave(values)}
                    disabled={!!errors.name || !values.name}
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
