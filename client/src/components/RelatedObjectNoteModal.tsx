import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import * as FieldHelper from "components/FieldHelper"
import { MessagesWithConflict } from "components/Messages"
import Model, { GQL_CREATE_NOTE, GQL_UPDATE_NOTE } from "components/Model"
import { RelatedObjectsTableInput } from "components/RelatedObjectsTable"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import utils from "utils"
import * as yup from "yup"

interface RelatedObjectNoteModalProps {
  note?: Model.notePropType
  currentObject?: Model.relatedObjectPropType
  showModal?: boolean
  onCancel: (...args: unknown[]) => unknown
  onSuccess: (...args: unknown[]) => unknown
  onDelete?: (...args: unknown[]) => unknown
}

const RelatedObjectNoteModal = ({
  note,
  currentObject,
  showModal,
  onCancel,
  onSuccess,
  onDelete
}: RelatedObjectNoteModalProps) => {
  const yupSchema = yup.object().shape({
    text: yup
      .string()
      .test("text", "text error", (text, testContext) =>
        utils.isEmptyHtml(text)
          ? testContext.createError({
              message: "You must provide the text"
            })
          : true
      )
      .default("")
  })
  const [error, setError] = useState(null)
  const [relatedObjects, setRelatedObjects] = useState(
    note.noteRelatedObjects || []
  )
  const edit = !!note.uuid

  return (
    <Modal
      centered
      show={showModal}
      onHide={close}
      size="lg"
      style={{ zIndex: "1300" }}
    >
      <Formik
        enableReinitialize
        onSubmit={onSubmit}
        validationSchema={yupSchema}
        initialValues={note}
      >
        {({
          isSubmitting,
          isValid,
          setFieldValue,
          setFieldTouched,
          resetForm,
          setSubmitting,
          submitForm
        }) => {
          return (
            <Form>
              <Modal.Header closeButton>
                <Modal.Title>
                  {`${note.uuid ? "Edit" : "Post a new"} note`}
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
                  <MessagesWithConflict
                    error={error}
                    objectType="Note"
                    onCancel={close}
                    onConfirm={() => {
                      resetForm({ note, isSubmitting: true })
                      onSubmit(note, { resetForm, setSubmitting }, true)
                    }}
                  />
                  <Field
                    name="text"
                    value={note.text}
                    component={FieldHelper.SpecialField}
                    onChange={value => setFieldValue("text", value)}
                    onHandleBlur={() => {
                      // validation will be done by setFieldValue
                      setFieldTouched("text", true, false)
                    }}
                    widget={<RichTextEditor disableFullSize />}
                    vertical
                  />
                  <RelatedObjectsTableInput
                    relatedObjects={relatedObjects}
                    currentObject={edit ? undefined : currentObject}
                    setRelatedObjects={setRelatedObjects}
                    showDelete
                  />
                </div>
              </Modal.Body>
              <Modal.Footer className="justify-content-between">
                <Button onClick={close} variant="outline-secondary">
                  Cancel
                </Button>
                {_isEmpty(relatedObjects) && onDelete && (
                  <ConfirmDestructive
                    onConfirm={() => onDelete(note.uuid)}
                    objectType="note"
                    objectDisplay={"#" + note.uuid}
                    variant="danger"
                    buttonLabel="Delete note"
                  />
                )}
                {!_isEmpty(relatedObjects) && (
                  <Button
                    onClick={submitForm}
                    variant="primary"
                    disabled={isSubmitting || !isValid}
                  >
                    Save
                  </Button>
                )}
              </Modal.Footer>
            </Form>
          )
        }}
      </Formik>
    </Modal>
  )

  function onSubmit(values, form, force) {
    return save(values, form, force)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function onSubmitSuccess(response, values, form) {
    const operation = edit ? "updateNote" : "createNote"
    onSuccess(response[operation])
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keep signature consistent
  function save(values, form, force) {
    const noteRelatedObjects = relatedObjects.map(o => ({
      relatedObjectType: o.relatedObjectType,
      relatedObjectUuid: o.relatedObjectUuid
    }))
    const updatedNote = {
      uuid: values.uuid,
      updatedAt: values.updatedAt,
      author: values.author,
      noteRelatedObjects,
      text: values.text
    }
    return API.mutation(edit ? GQL_UPDATE_NOTE : GQL_CREATE_NOTE, {
      note: updatedNote,
      force
    })
  }

  function close() {
    // Reset state before closing (cancel)
    setError(null)
    setRelatedObjects(note.noteRelatedObjects || [])
    onCancel()
  }
}

export default RelatedObjectNoteModal
