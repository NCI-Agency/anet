import { gql } from "@apollo/client"
import API from "api"
import * as FieldHelper from "components/FieldHelper"
import Messages from "components/Messages"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import Settings from "settings"
import * as yup from "yup"

const GQL_UPDATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!) {
    updateAttachment(attachment: $attachment)
  }
`

const AttachmentEditModal = ({
  index,
  attachment,
  showModal,
  onCancel,
  onSuccess,
  attachmentList,
  setAttachmentList
}) => {
  const yupSchema = yup.object().shape({
    fileName: yup.string().required().default(""),
    description: yup.string().default("")
  })
  const [error, setError] = useState(null)
  const [relatedObjects, setRelatedObjects] = useState(
    attachment.attachmentRelatedObjects || []
  )
  return (
    <Modal
      centered
      show={showModal}
      onHide={close}
      style={{ zIndex: "1300" }}
      dialogClassName="rich-text-modal"
    >
      <Formik
        enableReinitialize
        onSubmit={onSubmit}
        validationSchema={yupSchema}
        initialValues={attachment}
      >
        {({
          isSubmitting,
          isValid,
          setFieldValue,
          setFieldTouched,
          values,
          submitForm
        }) => {
          return (
            <Form>
              <Modal.Header closeButton>
                <Modal.Title>Edit Attachment</Modal.Title>
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
                    vertical
                    name="fileName"
                    placeholder={
                      Settings.fields.attachment.shortName.placeholder
                    }
                    component={FieldHelper.InputField}
                  />
                  <Field
                    vertical
                    name="description"
                    value={attachment.description}
                    component={FieldHelper.SpecialField}
                    onChange={value => setFieldValue("description", value)}
                    onHandleBlur={() => {
                      // validation will be done by setFieldValue
                      setFieldTouched("description", true, false)
                    }}
                    widget={<RichTextEditor className="description" />}
                  />
                </div>
              </Modal.Body>
              <Modal.Footer className="justify-content-between">
                <Button onClick={close} variant="outline-secondary">
                  Cancel
                </Button>
                <Button
                  onClick={submitForm}
                  variant="primary"
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
    const operation = "updateAttachment"
    onSuccess(response[operation])
  }

  function save(values, form) {
    const attachmentRelatedObjects = {
      relatedObjectType: relatedObjects.relatedObjectType,
      relatedObjectUuid: relatedObjects.relatedObjectUuid
    }
    const updatedAttachment = {
      uuid: values.uuid,
      fileName: values.fileName,
      description: values.description,
      mimeType: values.mimeType,
      classification: values.classification,
      attachmentRelatedObjects
    }
    const editedAttachment = API.mutation(GQL_UPDATE_ATTACHMENT, {
      attachment: updatedAttachment
    })
    const updatedAttachmentList = attachmentList
    updatedAttachmentList[index] = updatedAttachment
    updatedAttachmentList[index].content = values.content
    setAttachmentList(updatedAttachmentList)
    return editedAttachment
  }

  // Reset state before closing (cancel)
  function close() {
    setError(null)
    setRelatedObjects(attachment.attachmentRelatedObjects || [])
    onCancel()
  }
}

AttachmentEditModal.propTypes = {
  attachment: PropTypes.object,
  index: PropTypes.number,
  showModal: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  setAttachmentList: PropTypes.func,
  attachmentList: PropTypes.array
}

export default AttachmentEditModal
