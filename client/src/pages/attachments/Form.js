import { gql } from "@apollo/client"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Form, Formik } from "formik"
import _isEqual from "lodash/isEqual"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import Settings from "settings"

const GQL_CREATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!) {
    createAttachment(attachment: $attachment)
  }
`

const GQL_UPDATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!) {
    updateAttachment(attachment: $attachment)
  }
`

const GQL_DELETE_ATTACHMENT = gql`
  mutation ($uuid: String!) {
    deleteAttachment(uuid: $uuid)
  }
`

const AttachmentForm = ({ edit, title, initialValues }) => {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Attachment.yupSchema}
      initialValues={initialValues}
    >
      {({
        handleSubmit,
        isSubmitting,
        dirty,
        errors,
        setFieldValue,
        setFieldTouched,
        values,
        resetForm,
        submitForm
      }) => {
        const action = (
          <div>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Attachment
            </Button>
          </div>
        )
        // Only an author can delete a report, and only in DRAFT or REJECTED state.
        const canDelete = true
        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <FastField
                  name="fileName"
                  placeholder={Settings.fields.attachment.shortName.placeholder}
                  label={Settings.fields.attachment.shortName.label}
                  component={FieldHelper.InputField}
                />

                <FastField
                  name="description"
                  label={Settings.fields.attachment.description}
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // prevent initial unnecessary render of RichTextEditor
                    if (!_isEqual(values.description, value)) {
                      setFieldValue("description", value, true)
                    }
                  }}
                  onHandleBlur={() => {
                    // validation will be done by setFieldValue
                    setFieldTouched("description", true, false)
                  }}
                  widget={<RichTextEditor className="description" />}
                />

                {/* <FastField
                  name="attachments"
                  label={Settings.fields.report.attachments.label}
                  component={FieldHelper.SpecialField}
                  widget={<Attachments className="attachmentField" />}
                /> */}
              </Fieldset>

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
                    Cancel
                  </Button>
                </div>
                {canDelete && (
                  <ConfirmDestructive
                    onConfirm={() => onConfirmDelete(values, resetForm)}
                    objectType="report"
                    objectDisplay={values.uuid}
                    variant="danger"
                    buttonLabel={"Delete this Attachment"}
                    buttonDisabled={isSubmitting}
                  />
                )}
                <div>
                  <Button
                    id="formBottomSubmit"
                    variant="primary"
                    onClick={submitForm}
                    disabled={isSubmitting}
                  >
                    Save Attachment
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function onConfirmDelete(values, resetForm) {
    API.mutation(GQL_DELETE_ATTACHMENT, { uuid: values.uuid })
      .then(data => {
        // reset the form to latest values
        // to avoid unsaved changes prompt if it somehow becomes dirty
        resetForm({ values, isSubmitting: true })
        navigate("/", { state: { success: "Report deleted" } })
      })
      .catch(error => {
        setError(error)
        jumpToTop()
      })
  }

  function onCancel() {
    navigate(-1)
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const operation = edit ? "updateAttachment" : "createAttachment"
    const attachment = new Attachment({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (!edit) {
      navigate(Attachment.pathForEdit(attachment), { replace: true })
    }
    navigate(Attachment.pathFor(attachment), {
      state: { success: "Attachment saved" }
    })
  }

  function save(values, form) {
    const attachment = Attachment.filterClientSideFields(values)
    attachment.content = null
    attachment.classification = "NATO_UNCLASSIFIED"
    return API.mutation(edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT, {
      attachment: attachment
    })
  }
}

AttachmentForm.propTypes = {
  initialValues: PropTypes.instanceOf(Attachment).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool
}

AttachmentForm.defaultProps = {
  title: "",
  edit: false
}

export default AttachmentForm
