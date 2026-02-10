import { gql } from "@apollo/client"
import API from "api"
import { ENTITY_TYPES } from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import AppContext from "components/AppContext"
import ConfirmDestructive from "components/ConfirmDestructive"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { MessagesWithConflict } from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import ObjectHistory from "components/ObjectHistory"
import { jumpToTop } from "components/Page"
import { RelatedObjectsTableInput } from "components/RelatedObjectsTable"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _isEqual from "lodash/isEqual"
import { Attachment } from "models"
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
  mutation ($attachment: AttachmentInput!, $force: Boolean) {
    updateAttachment(attachment: $attachment, force: $force)
  }
`

const GQL_DELETE_ATTACHMENT = gql`
  mutation ($uuid: String!) {
    deleteAttachment(uuid: $uuid)
  }
`

interface AttachmentFormProps {
  initialValues: Attachment
  title?: string
  edit?: boolean
}

const AttachmentForm = ({
  edit = false,
  title = "",
  initialValues
}: AttachmentFormProps) => {
  const navigate = useNavigate()
  const { currentUser } = useContext(AppContext)
  const [error, setError] = useState(null)
  const canEdit =
    currentUser.isAdmin() || currentUser.uuid === initialValues.author.uuid
  const classificationButtons = utils.getConfidentialityLabelChoices()

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Attachment.yupSchema}
      initialValues={initialValues}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        resetForm,
        setSubmitting,
        submitForm
      }) => {
        const { iconSize, iconImage } = utils.getAttachmentIconDetails(values)
        const action = (
          <>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Attachment
            </Button>
            {edit && <ObjectHistory objectUuid={values.uuid} />}
          </>
        )

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <MessagesWithConflict
              error={error}
              objectType="Attachment"
              onCancel={onCancel}
              onConfirm={() => {
                resetForm({ values, isSubmitting: true })
                onSubmit(values, { resetForm, setSubmitting }, true)
              }}
            />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <div className="attachment-show" style={{ display: "flex" }}>
                  <Col xs={12} sm={3} className="attachment-column label-align">
                    <img
                      className="image-preview info-show card-image attachment-image"
                      src={iconImage}
                      width={iconSize}
                      height={iconSize}
                      style={{ objectFit: "contain" }}
                    />
                  </Col>
                  <Col className="attachment-details" xs={12} sm={3} lg={10}>
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={Settings.fields.attachment.caption}
                      name="caption"
                      component={FieldHelper.InputField}
                    />

                    <DictionaryField
                      wrappedComponent={FastField}
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
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={Settings.confidentialityLabel}
                        name="classification"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={classificationButtons}
                        enableClear
                        onChange={value =>
                          setFieldValue("classification", value)
                        }
                      />
                    ) : (
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={Settings.confidentialityLabel}
                        name="classification"
                        component={FieldHelper.ReadonlyField}
                      />
                    )}

                    {edit && (
                      <Field
                        label="Used in"
                        name="attachmentRelatedObjects"
                        component={FieldHelper.SpecialField}
                        value={values.attachmentRelatedObjects}
                        widget={
                          <RelatedObjectsTableInput
                            title=""
                            relatedObjects={values.attachmentRelatedObjects}
                            entityTypes={[
                              ENTITY_TYPES.EVENTS,
                              ENTITY_TYPES.EVENT_SERIES,
                              ENTITY_TYPES.LOCATIONS,
                              ENTITY_TYPES.ORGANIZATIONS,
                              ENTITY_TYPES.PEOPLE,
                              ENTITY_TYPES.POSITIONS,
                              ENTITY_TYPES.REPORTS
                            ]}
                            setRelatedObjects={value =>
                              setFieldValue("attachmentRelatedObjects", value)
                            }
                            showDelete
                          />
                        }
                      />
                    )}

                    <DictionaryField
                      wrappedComponent={FastField}
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
      .then(() => {
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

  function onSubmit(values, form, force) {
    return save(values, force)
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

  function save(values, force) {
    const attachment = Attachment.filterClientSideFields(values)
    attachment.attachmentRelatedObjects = values.attachmentRelatedObjects.map(
      ({ relatedObjectType, relatedObjectUuid }) => ({
        relatedObjectType,
        relatedObjectUuid
      })
    )
    return API.mutation(edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT, {
      attachment,
      force
    })
  }
}

export default AttachmentForm
