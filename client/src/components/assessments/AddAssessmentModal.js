import API from "api"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import Model, { GQL_CREATE_NOTE, NOTE_TYPE } from "components/Model"
import Messages from "components/Messages"
import { Form, Formik } from "formik"
import { Task } from "models"
import PropTypes from "prop-types"
import React, { useMemo, useState } from "react"
import { Button, Modal } from "react-bootstrap"

const AddAssessmentModal = ({
  task,
  assessmentPeriod,
  showModal,
  onCancel,
  onSuccess
}) => {
  const [assessmentError, setAssessmentError] = useState(null)
  const yupSchema = task.periodAssessmentYupSchema()
  const initialValues = useMemo(() => Model.fillObject({}, yupSchema), [
    yupSchema
  ])
  const periodAssessmentConfig = task.periodAssessmentConfig()
  return (
    <Modal show={showModal} onHide={closeModal}>
      <Formik
        enableReinitialize
        onSubmit={onAssessmentSubmit}
        validationSchema={yupSchema}
        initialValues={initialValues}
      >
        {({
          isSubmitting,
          isValid,
          setFieldValue,
          setFieldTouched,
          validateForm,
          values,
          submitForm
        }) => {
          return (
            <Form>
              <Modal.Header closeButton>
                <Modal.Title>
                  Assessment for {task.shortName} for{" "}
                  {assessmentPeriod.start.format("MMM-YYYY")}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: 5,
                    height: "100%"
                  }}
                >
                  <Messages error={assessmentError} />
                  <CustomFieldsContainer
                    fieldsConfig={periodAssessmentConfig}
                    fieldNamePrefix="taskAssessment"
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                    vertical
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button className="pull-left" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  onClick={submitForm}
                  bsStyle="primary"
                  disabled={isSubmitting}
                >
                  Save
                </Button>
              </Modal.Footer>
            </Form>
          )
        }}
      </Formik>
    </Modal>
  )

  function closeModal() {
    setAssessmentError(null)
    onCancel()
  }

  function onAssessmentSubmit(values, form) {
    return saveAssessment(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setAssessmentError(error)
        form.setSubmitting(false)
      })
  }

  function onSubmitSuccess(response, values, form) {
    onSuccess()
  }

  function saveAssessment(values, form) {
    const updatedNote = {
      type: NOTE_TYPE.ASSESSMENT,
      noteRelatedObjects: [
        {
          relatedObjectType: "tasks",
          relatedObjectUuid: task.uuid
        }
      ]
    }
    updatedNote.text = customFieldsJSONString(values, true, "taskAssessment")
    return API.mutation(GQL_CREATE_NOTE, {
      note: updatedNote
    })
  }
}
AddAssessmentModal.propTypes = {
  task: PropTypes.instanceOf(Task).isRequired,
  assessmentPeriod: PropTypes.object,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}

export default AddAssessmentModal
