import API, { Settings } from "api"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import { GQL_CREATE_NOTE, NOTE_TYPE } from "components/Model"
import Messages from "components/Messages"

import { Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Task } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const AddAssessmentModal = ({
  task,
  assessmentPeriod,
  showModal,
  onCancel,
  onSuccess
}) => {
  const [assessmentError, setAssessmentError] = useState(null)
  const isTopLevelTask = _isEmpty(task.customFieldRef1)
  const fieldSettings = isTopLevelTask
    ? Settings.fields.task.topLevel
    : Settings.fields.task.subLevel
  const yupSchema = isTopLevelTask
    ? Task.topLevelAssessmentCustomFieldsSchema
    : Task.subLevelAssessmentCustomFieldsSchema
  return (
    <Modal show={showModal} onHide={closeModal}>
      <Formik
        enableReinitialize
        onSubmit={onAssessmentSubmit}
        validationSchema={yupSchema}
        initialValues={{
          type: NOTE_TYPE.ASSESSMENT,
          noteRelatedObjects: [
            {
              relatedObjectType: "tasks",
              relatedObjectUuid: task.uuid
            }
          ]
        }}
      >
        {({
          isSubmitting,
          isValid,
          setFieldValue,
          setFieldTouched,
          validateForm,
          values,
          submitForm
        }) => (
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
                  fieldsConfig={fieldSettings.assessment?.customFields}
                  formikProps={{
                    setFieldTouched,
                    setFieldValue,
                    values,
                    validateForm
                  }}
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
                disabled={isSubmitting || !isValid}
              >
                Save
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  )

  function closeModal() {
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
      uuid: values.uuid,
      author: values.author,
      type: values.type,
      noteRelatedObjects: values.noteRelatedObjects,
      text: values.text
    }
    updatedNote.text = customFieldsJSONString(values)
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
