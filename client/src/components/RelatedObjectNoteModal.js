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
    onSuccess: PropTypes.func.isRequired
  }
  yupSchema = yup.object().shape({
    type: yup.string().required(),
    text: yup.string().default("")
  })
  state = {
    error: null
  }

  cooperativeButtons = [
    {
      value: "Yes",
      label: "Yes"
    },
    {
      value: "Sometimes",
      label: "Sometimes"
    },
    {
      value: "No",
      label: "No"
    }
  ]

  competentButtons = [
    {
      value: "Yes, do something",
      label: "Yes, do something"
    },
    {
      value: "Yes, do something else",
      label: "Yes, do something else"
    },
    {
      value: "No",
      label: "No"
    }
  ]

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
                        <Field
                          name="Q1"
                          label="question 1?"
                          component={FieldHelper.renderButtonToggleGroup}
                          buttons={this.cooperativeButtons}
                          onChange={value => {
                            setFieldValue("Q1", value)
                          }}
                        />
                        <br />
                        <br />
                        <Field
                          name="Q2"
                          label="question 2?"
                          component={FieldHelper.renderButtonToggleGroup}
                          buttons={this.competentButtons}
                          onChange={value => {
                            setFieldValue("Q2", value)
                          }}
                        />
                        <br />
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
