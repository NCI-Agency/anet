import API from "api"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import Messages from "components/Messages"
import Model, {
  ENTITY_ASSESSMENT_PARENT_FIELD,
  GQL_CREATE_NOTE,
  GQL_UPDATE_NOTE
} from "components/Model"
import { Form, Formik } from "formik"
import _cloneDeep from "lodash/cloneDeep"
import _isEmpty from "lodash/isEmpty"
import { formatPeriodBoundary, RECURRENCE_TYPE } from "periodUtils"
import React, { useMemo, useState } from "react"
import { Button, Modal } from "react-bootstrap"
import QuestionSet from "./QuestionSet"

interface AssessmentModalProps {
  showModal?: boolean
  note?: any
  assessmentKey: string
  assessment?: any
  assessmentYupSchema: any
  assessmentConfig: any
  // FIXME: required when recurrence is not ON_DEMAND
  assessmentPeriod?: any
  recurrence: string
  title?: string
  onSuccess: (...args: unknown[]) => unknown
  onCancel: (...args: unknown[]) => unknown
  entity: any
}

const AssessmentModal = ({
  showModal = false,
  note,
  assessmentKey,
  assessment,
  assessmentYupSchema,
  assessmentConfig,
  assessmentPeriod,
  recurrence,
  title = "Assessment",
  onSuccess,
  onCancel,
  entity
}: AssessmentModalProps) => {
  const [assessmentError, setAssessmentError] = useState(null)
  const dictionaryPath = entity.getAssessmentDictionaryPath()
  const edit = !!note.uuid
  const initialValues = useMemo(
    () =>
      _isEmpty(assessment)
        ? Model.fillObject({}, assessmentYupSchema)
        : { [ENTITY_ASSESSMENT_PARENT_FIELD]: assessment },
    [assessment, assessmentYupSchema]
  )
  return (
    <Modal
      centered
      show={showModal}
      onHide={closeModal}
      size="lg"
      style={{ zIndex: "1250" }}
    >
      <Formik
        enableReinitialize
        onSubmit={onAssessmentSubmit}
        validationSchema={assessmentYupSchema}
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
                <Modal.Title>{title}</Modal.Title>
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
                  {!_isEmpty(assessmentConfig.questions) && (
                    <CustomFieldsContainer
                      fieldsConfig={assessmentConfig.questions}
                      parentFieldName={ENTITY_ASSESSMENT_PARENT_FIELD}
                      formikProps={{
                        setFieldTouched,
                        setFieldValue,
                        values,
                        validateForm
                      }}
                      vertical
                    />
                  )}
                  {!_isEmpty(assessmentConfig.questionSets) && (
                    <QuestionSet
                      entity={entity}
                      questionSets={assessmentConfig.questionSets}
                      parentFieldName={`${ENTITY_ASSESSMENT_PARENT_FIELD}.questionSets`}
                      formikProps={{
                        setFieldTouched,
                        setFieldValue,
                        values,
                        validateForm
                      }}
                      readonly={false}
                      vertical
                    />
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer className="justify-content-between">
                <Button onClick={closeModal} variant="outline-secondary">
                  Cancel
                </Button>
                <Button
                  onClick={submitForm}
                  variant="primary"
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
    const operation = edit ? "updateNote" : "createNote"
    onSuccess(response[operation])
  }

  function saveAssessment(values, form) {
    const noteRelatedObjects = note.noteRelatedObjects.map(o => ({
      relatedObjectType: o.relatedObjectType,
      relatedObjectUuid: o.relatedObjectUuid
    }))
    const updatedNote = {
      uuid: note.uuid,
      author: note.author,
      type: note.type,
      assessmentKey: `${dictionaryPath}.${assessmentKey}`,
      noteRelatedObjects
    }
    // values contains the assessment fields
    const clonedValues = _cloneDeep(values)
    clonedValues[ENTITY_ASSESSMENT_PARENT_FIELD].__recurrence = recurrence
    if (recurrence !== RECURRENCE_TYPE.ON_DEMAND) {
      // __periodStart is not used for ondemand assessments
      clonedValues[ENTITY_ASSESSMENT_PARENT_FIELD].__periodStart =
        formatPeriodBoundary(assessmentPeriod.start)
    }
    updatedNote.text = customFieldsJSONString(
      clonedValues,
      true,
      ENTITY_ASSESSMENT_PARENT_FIELD
    )
    return API.mutation(edit ? GQL_UPDATE_NOTE : GQL_CREATE_NOTE, {
      note: updatedNote
    })
  }
}

export default AssessmentModal
