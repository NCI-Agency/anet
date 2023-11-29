import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import AttachmentRelatedObjectsTable from "components/Attachment/AttachmentRelatedObjectsTable"
import ConfirmDestructive from "components/ConfirmDestructive"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import _isEqual from "lodash/isEqual"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button, Col } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

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
  const { currentUser } = useContext(AppContext)
  const [error, setError] = useState(null)
  const canEdit =
    currentUser.isAdmin() || currentUser.uuid === initialValues.author.uuid
  const classifications = Settings.fields.attachment.classification.choices
  const classificationButtons = Object.keys(classifications).map(key => ({
    value: key,
    label: classifications[key]
  }))
  const DictFastField = DictionaryField(FastField)

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
        const { backgroundSize, backgroundImage } =
          utils.getAttachmentIconDetails(values)
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
        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <div className="attachment-show" style={{ display: "flex" }}>
                  <Col xs={12} sm={3} className="attachment-column label-align">
                    <div
                      className="image-preview info-show card-image attachment-image"
                      style={{
                        backgroundSize,
                        backgroundImage: `url(${backgroundImage})`
                      }}
                    />
                  </Col>
                  <Col className="attachment-details" xs={12} sm={3} lg={10}>
                    <DictFastField
                      dictProps={Settings.fields.attachment.caption}
                      name="caption"
                      component={FieldHelper.InputField}
                    />

                    <DictFastField
                      dictProps={Settings.fields.attachment.fileName}
                      name="fileName"
                      component={FieldHelper.ReadonlyField}
                    />

                    <Field
                      name="owner"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <LinkTo modelType="Person" model={values.author} />
                      }
                    />

                    <Field
                      name="mimeType"
                      component={FieldHelper.ReadonlyField}
                    />

                    {canEdit ? (
                      <DictFastField
                        dictProps={Settings.fields.attachment.classification}
                        name="classification"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={classificationButtons}
                        onChange={value =>
                          setFieldValue("classification", value)}
                      />
                    ) : (
                      <DictFastField
                        dictProps={Settings.fields.attachment.classification}
                        name="classification"
                        component={FieldHelper.ReadonlyField}
                      />
                    )}

                    {edit && (
                      <Field
                        name="used in"
                        component={FieldHelper.ReadonlyField}
                        humanValue={
                          <AttachmentRelatedObjectsTable
                            relatedObjects={values.attachmentRelatedObjects}
                          />
                        }
                      />
                    )}

                    <DictFastField
                      dictProps={Settings.fields.attachment.description}
                      name="description"
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
                      widget={
                        <RichTextEditor
                          className="description"
                          placeholder={
                            Settings.fields.attachment.description?.placeholder
                          }
                        />
                      }
                    />
                  </Col>
                </div>
              </Fieldset>

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
                    Cancel
                  </Button>
                </div>
                <ConfirmDestructive
                  onConfirm={() => onConfirmDelete(values, resetForm)}
                  objectType="attachment"
                  objectDisplay={values.uuid}
                  variant="danger"
                  buttonLabel="Delete this Attachment"
                  buttonDisabled={isSubmitting}
                />
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
        navigate("/", { state: { success: "Attachment deleted" } })
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
    return save(values)
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

  function save(values) {
    const attachment = Attachment.filterClientSideFields(values)
    attachment.attachmentRelatedObjects = values.attachmentRelatedObjects.map(
      ({ relatedObjectType, relatedObjectUuid }) => ({
        relatedObjectType,
        relatedObjectUuid
      })
    )
    return API.mutation(edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT, {
      attachment
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
