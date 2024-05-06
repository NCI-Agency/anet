import { gql } from "@apollo/client"
import API from "api"
import MultiTypeAdvancedSelectComponent, {
  ENTITY_TYPES
} from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import AppContext from "components/AppContext"
import ConfirmDestructive from "components/ConfirmDestructive"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { MODEL_TO_OBJECT_TYPE, OBJECT_TYPE_TO_MODEL } from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import RemoveButton from "components/RemoveButton"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button, Col, Table } from "react-bootstrap"
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
  const classificationButtons = Object.entries(
    Settings.classification.choices
  ).map(([value, label]) => ({
    value,
    label
  }))

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
          <Button
            key="submit"
            variant="primary"
            onClick={submitForm}
            disabled={isSubmitting}
          >
            Save Attachment
          </Button>
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
                        dictProps={Settings.classification}
                        name="classification"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={classificationButtons}
                        enableClear
                        onChange={value =>
                          setFieldValue("classification", value)}
                      />
                    ) : (
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={Settings.classification}
                        name="classification"
                        component={FieldHelper.ReadonlyField}
                      />
                    )}

                    {edit && (
                      <Field
                        name="used in"
                        component={FieldHelper.SpecialField}
                        value={values.attachmentRelatedObjects}
                        widget={
                          <MultiTypeAdvancedSelectComponent
                            fieldName="attachmentRelatedObjects"
                            entityTypes={[
                              ENTITY_TYPES.LOCATIONS,
                              ENTITY_TYPES.ORGANIZATIONS,
                              ENTITY_TYPES.PEOPLE,
                              ENTITY_TYPES.REPORTS
                            ]}
                            valueKey="relatedObjectUuid"
                            isMultiSelect
                            onConfirm={(value, entityType) => {
                              if (
                                value.length >
                                values.attachmentRelatedObjects?.length
                              ) {
                                // entity was added at the end, set correct value
                                const addedEntity = value.pop()
                                value.push({
                                  relatedObjectType:
                                    MODEL_TO_OBJECT_TYPE[entityType],
                                  relatedObjectUuid: addedEntity.uuid,
                                  relatedObject: addedEntity
                                })
                              }
                              setFieldValue("attachmentRelatedObjects", value)
                            }}
                          />
                        }
                      >
                        {!_isEmpty(values.attachmentRelatedObjects) && (
                          <Table
                            id="attachmentRelatedObjects-value"
                            striped
                            hover
                            responsive
                          >
                            <tbody>
                              {values.attachmentRelatedObjects.map(entity => (
                                <tr key={entity.relatedObjectUuid}>
                                  <td>
                                    <LinkTo
                                      modelType={entity.relatedObjectType}
                                      model={{
                                        uuid: entity.relatedObjectUuid,
                                        ...entity.relatedObject
                                      }}
                                    />
                                  </td>
                                  <td className="col-1">
                                    <RemoveButton
                                      title={`Unlink this ${OBJECT_TYPE_TO_MODEL[entity.relatedObjectType]}`}
                                      onClick={() => {
                                        let found = false
                                        const newValue =
                                          values.attachmentRelatedObjects.filter(
                                            e => {
                                              if (_isEqual(e, entity)) {
                                                found = true
                                                return false
                                              }
                                              return true
                                            }
                                          )
                                        if (found) {
                                          setFieldValue(
                                            "attachmentRelatedObjects",
                                            newValue
                                          )
                                        }
                                      }}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Field>
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
