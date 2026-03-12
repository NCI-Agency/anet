import { gqlAllEventTypeFields } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import * as FieldHelper from "components/FieldHelper"
import { MessagesWithConflict } from "components/Messages"
import Model from "components/Model"
import { Field, Form, Formik } from "formik"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const GQL_CREATE_EVENT_TYPE = gql`
  mutation ($eventType: EventTypeInput!) {
    createEventType(eventType: $eventType) {
      ${gqlAllEventTypeFields}
    }
  }
`

function save(values: any, _form: any, force?: boolean) {
  return API.mutation(GQL_CREATE_EVENT_TYPE, {
    eventType: values,
    force
  })
}

interface AddNewEventTypeModalProps {
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
  validateName: (name: string) => boolean
}

const AddNewEventTypeModal = ({
  showModal,
  onCancel,
  onSuccess,
  validateName
}: AddNewEventTypeModalProps) => {
  const [error, setError] = useState(null)
  const eventType = {
    name: "",
    status: Model.STATUS.ACTIVE
  }
  return (
    <Formik
      enableReinitialize
      initialValues={eventType}
      validate={values => {
        const errors: { name?: string } = {}
        const name = values.name
        if (name && !validateName(name)) {
          errors.name = "Name already exists"
        }
        return errors
      }}
      onSubmit={onSubmit}
    >
      {({
        setFieldValue,
        values,
        submitForm,
        resetForm,
        setSubmitting,
        errors
      }) => (
        <Modal
          backdrop="static"
          centered
          show={showModal}
          onHide={() => close(setFieldValue)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Add New Event Type</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <MessagesWithConflict
              error={error}
              objectType="EventType"
              onCancel={() => close(setFieldValue)}
              onConfirm={() => {
                resetForm({ values, isSubmitting: true })
                onSubmit(values, { resetForm, setSubmitting }, true)
              }}
            />
            <Form className="d-flex flex-column gap-3">
              <Field
                name="name"
                component={FieldHelper.InputField}
                placeholder="Give this event type a name"
                vertical
              />
            </Form>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <Button
              onClick={() => close(setFieldValue)}
              variant="outline-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={submitForm}
              variant="primary"
              disabled={!!errors.name || !values.name}
            >
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Formik>
  )

  function close(setFieldValue) {
    // Reset state before closing (cancel)
    setError(null)
    setFieldValue("name", "")
    onCancel()
  }

  async function onSubmit(values, form, force) {
    try {
      await save(values, form, force)
      form.setFieldValue("name", "")
      return onSuccess()
    } catch (error) {
      form.setSubmitting(false)
      setError(error)
    }
  }
}

export default AddNewEventTypeModal
