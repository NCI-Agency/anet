import API from "api"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Messages from "components/Messages"
import Model, { GRAPHQL_NOTE_FIELDS, NOTE_TYPE } from "components/Model"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { Person } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, Modal } from "react-bootstrap"
import * as yup from "yup"

class BaseRelatedObjectNoteModal extends Component {
  static propTypes = {
    currentUser: PropTypes.instanceOf(Person),
    note: Model.notePropTypes,
    showModal: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    questions: PropTypes.array
  }
  yupSchema = yup.object().shape({
    type: yup.string().required(),
    text: yup.string().default("")
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
          isInitialValid
          initialValues={note}
        >
          {({ isSubmitting, isValid, setFieldValue, values, submitForm }) => {
            const isJson = note.type !== NOTE_TYPE.FREE_TEXT
            const jsonFields = isJson && note.text ? JSON.parse(note.text) : {}
            const noteText = isJson ? jsonFields.text : note.text
            const typeName =
              note.type === NOTE_TYPE.PARTNER_ASSESSMENT ? "assessment" : "note"
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
                    <Messages error={this.state.error} />

                    {note.type === NOTE_TYPE.PARTNER_ASSESSMENT && (
                      <>
                        {this.props.questions.map(question => (
                          <>
                            <Field
                              name={question.id}
                              label={question.label}
                              component={FieldHelper.renderButtonToggleGroup}
                              buttons={question.choice}
                              onChange={value => {
                                setFieldValue(question.id, value)
                              }}
                            />
                            <br />
                            <br />
                          </>
                        ))}
                      </>
                    )}

                    <Field
                      name="note"
                      value={noteText}
                      component={FieldHelper.renderSpecialField}
                      onChange={value => setFieldValue("text", value)}
                      widget={<RichTextEditor className="textField" />}
                      vertical
                    />
                  </div>
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
    const operation = edit ? "updateNote" : "createNote"
    const graphql =
      /* GraphQL */ operation + `(note: $note) { ${GRAPHQL_NOTE_FIELDS} }`
    const newNote = {
      type: values.type,
      noteRelatedObjects: values.noteRelatedObjects,
      text: values.text
    }
    const isJson = newNote.type !== NOTE_TYPE.FREE_TEXT
    if (isJson) {
      const { type, noteRelatedObjects, ...jsonFields } = values
      newNote.text = JSON.stringify(jsonFields)
    }
    const variables = { note: newNote }
    const variableDef = "($note: NoteInput!)"
    return API.mutation(graphql, variables, variableDef)
  }

  close = () => {
    // Reset state before closing (cancel)
    this.setState({
      error: null
    })
    this.props.onCancel()
  }
}

const RelatedObjectNoteModal = props => (
  <AppContext.Consumer>
    {context => (
      <BaseRelatedObjectNoteModal
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default RelatedObjectNoteModal
