import API from "api"
import ConfirmDelete from "components/ConfirmDelete"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, {
  GQL_CREATE_NOTE,
  GQL_UPDATE_NOTE,
  NOTE_TYPE
} from "components/Model"
import RelatedObjectsTable from "components/RelatedObjectsTable"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import utils from "utils"
import * as yup from "yup"

const RelatedObjectNoteModal = ({
  note,
  currentObject,
  showModal,
  onCancel,
  onSuccess,
  onDelete
}) => {
  const yupSchema = yup.object().shape({
    type: yup.string().required(),
    text: yup.string().default("")
  })
  const [error, setError] = useState(null)
  const [relatedObjects, setRelatedObjects] = useState(
    note.noteRelatedObjects || []
  )
  const edit = !!note.uuid

  return (
    <Modal show={showModal} onHide={close}>
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
          values,
          submitForm
        }) => {
          const isJson = note.type !== NOTE_TYPE.FREE_TEXT
          const jsonFields =
            isJson && note.text ? utils.parseJsonSafe(note.text) : {}
          const noteText = isJson ? jsonFields.text : note.text
          const typeName =
            note.type === NOTE_TYPE.PARTNER_ASSESSMENT ||
            note.type === NOTE_TYPE.ASSESSMENT
              ? "assessment"
              : "note"
          return (
            <Form>
              <Modal.Header closeButton>
                <Modal.Title>
                  {(note.uuid ? "Edit " : "Post a new ") + typeName}
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
                  <Messages error={error} />
                  <Field
                    name="text"
                    value={noteText}
                    component={FieldHelper.SpecialField}
                    onChange={value => setFieldValue("text", value)}
                    widget={
                      <RichTextEditor
                        className="textField"
                        onHandleBlur={() => {
                          // validation will be done by setFieldValue
                          setFieldTouched("text", true, false)
                        }}
                        linkToComp={LinkTo}
                      />
                    }
                    vertical
                  />
                  <RelatedObjectsTable
                    relatedObjects={relatedObjects}
                    currentObject={edit ? undefined : currentObject}
                    setRelatedObjects={setRelatedObjects}
                    showDelete
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button className="pull-left" onClick={close}>
                  Cancel
                </Button>
                {_isEmpty(relatedObjects) && onDelete && (
                  <ConfirmDelete
                    onConfirmDelete={() => onDelete(note.uuid)}
                    objectType="note"
                    objectDisplay={"#" + note.uuid}
                    bsStyle="warning"
                    buttonLabel="Delete note"
                  />
                )}
                {!_isEmpty(relatedObjects) && (
                  <Button
                    onClick={submitForm}
                    bsStyle="primary"
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

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
      })
  }

  function onSubmitSuccess(response, values, form) {
    const operation = edit ? "updateNote" : "createNote"
    onSuccess(response[operation])
  }

  function save(values, form) {
    const noteRelatedObjects = relatedObjects.map(o => ({
      relatedObjectType: o.relatedObjectType,
      relatedObjectUuid: o.relatedObjectUuid
    }))
    const updatedNote = {
      uuid: values.uuid,
      author: values.author,
      type: values.type,
      noteRelatedObjects,
      text: values.text
    }
    const isJson = updatedNote.type !== NOTE_TYPE.FREE_TEXT
    if (isJson) {
      const { uuid, author, type, noteRelatedObjects, ...jsonFields } = values
      updatedNote.text = JSON.stringify(jsonFields)
    }
    return API.mutation(edit ? GQL_UPDATE_NOTE : GQL_CREATE_NOTE, {
      note: updatedNote
    })
  }

  function close() {
    // Reset state before closing (cancel)
    setError(null)
    setRelatedObjects(note.noteRelatedObjects || [])
    onCancel()
  }
}
RelatedObjectNoteModal.propTypes = {
  note: Model.notePropType,
  currentObject: Model.relatedObjectPropType,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onDelete: PropTypes.func
}

export default RelatedObjectNoteModal
