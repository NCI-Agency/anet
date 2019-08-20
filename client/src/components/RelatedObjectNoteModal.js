import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Messages from "components/Messages"
import Model, { GRAPHQL_NOTE_FIELDS, NOTE_TYPE } from "components/Model"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import PropTypes from "prop-types"
import React, { Component } from "react"
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

export default class RelatedObjectNoteModal extends Component {
  static propTypes = {
    note: Model.notePropTypes,
    showModal: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }
  yupSchema = yup.object().shape({
    type: yup
      .string()
      .required()
      .default(NOTE_TYPE.FREE_TEXT),
    text: yup
      .string()
      .required()
      .default("")
  })
  state = {
    error: null
  }

  render() {
    const { showModal, note } = this.props
    return (
      <Modal show={showModal} onHide={this.close}>
        <Formik
          enableReinitialize
          onSubmit={this.onSubmit}
          validationSchema={this.yupSchema}
          isInitialValid={() => this.yupSchema.isValidSync(note)}
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
            const jsonFields = isJson ? JSON.parse(note.text) : {}
            const noteText = isJson ? jsonFields.text : note.text
            return (
              <Form>
                <Modal.Header closeButton>
                  <Modal.Title>
                    {note.uuid ? "Edit note" : "Post a new note"}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Messages error={this.state.error} />
                  <Field
                    name="text"
                    value={noteText}
                    component={FieldHelper.renderSpecialField}
                    onChange={value => setFieldValue("text", value)}
                    widget={
                      <RichTextEditor
                        className="textField"
                        onHandleBlur={() => setFieldTouched("text", true)}
                      />
                    }
                    vertical
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button className="pull-left" onClick={this.close}>
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
  }

  onSubmit = (values, form) => {
    return this.save(values, form)
      .then(response => this.onSubmitSuccess(response, values, form))
      .catch(error => {
        this.setState({ error }, () => {
          form.setSubmitting(false)
        })
      })
  }

  onSubmitSuccess = (response, values, form) => {
    const edit = !!this.props.note.uuid
    const operation = edit ? "updateNote" : "createNote"
    this.props.onSuccess(response[operation])
  }

  save = (values, form) => {
    const edit = !!this.props.note.uuid
    const note = values
    const isJson = note.type !== NOTE_TYPE.FREE_TEXT
    if (isJson) {
      const jsonFields = JSON.parse(this.props.note.text)
      jsonFields.text = note.text
      note.text = JSON.stringify(jsonFields)
    }
    return API.mutation(edit ? GQL_UPDATE_NOTE : GQL_CREATE_NOTE, { note })
  }

  close = () => {
    // Reset state before closing (cancel)
    this.setState({
      error: null
    })
    this.props.onCancel()
  }
}
