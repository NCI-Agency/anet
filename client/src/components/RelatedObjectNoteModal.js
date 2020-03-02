import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Messages from "components/Messages"
import Model, { GRAPHQL_NOTE_FIELDS, NOTE_TYPE } from "components/Model"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import * as yup from "yup"

const GQL_CREATE_NOTE = gql`
  mutation($note: NoteInput!) {
    createNote(note: $note) {
      ${GRAPHQL_NOTE_FIELDS}
    }
  }
`
const GQL_UPDATE_NOTE = gql`
  mutation($note: NoteInput!) {
    updateNote(note: $note) {
      ${GRAPHQL_NOTE_FIELDS}
    }
  }
`
const RelatedObjectNoteModal = ({
  note,
  showModal,
  onCancel,
  onSuccess,
  questions
}) => {
  const yupSchema = yup.object().shape({
    type: yup.string().required(),
    text: yup.string().default("")
  })
  const [error, setError] = useState(null)
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
          const jsonFields = isJson && note.text ? JSON.parse(note.text) : {}
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

                  {note.type === NOTE_TYPE.PARTNER_ASSESSMENT && (
                    <>
                      {questions.map(question => (
                        <React.Fragment key={question.id}>
                          <p>{question.label}</p>
                          <Field
                            name={question.id}
                            label=""
                            component={FieldHelper.RadioButtonToggleGroupField}
                            buttons={question.choice}
                            onChange={value => {
                              setFieldValue(question.id, value)
                            }}
                          />
                          <br />
                          <br />
                        </React.Fragment>
                      ))}
                    </>
                  )}

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
                      />
                    }
                    vertical
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button className="pull-left" onClick={close}>
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
    const updatedNote = {
      uuid: values.uuid,
      author: values.author,
      type: values.type,
      noteRelatedObjects: values.noteRelatedObjects,
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
    onCancel()
  }
}
RelatedObjectNoteModal.propTypes = {
  note: Model.notePropTypes,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  questions: PropTypes.array
}

export default RelatedObjectNoteModal
