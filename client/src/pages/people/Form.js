import { gql } from "@apollo/client"
import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AppContext from "components/AppContext"
import UploadAttachment, {
  attachmentSave
} from "components/Attachment/UploadAttachment"
import AvatarEditModal from "components/AvatarEditModal"
import ConfirmDestructive from "components/ConfirmDestructive"
import CustomDateInput from "components/CustomDateInput"
import {
  CustomFieldsContainer,
  customFieldsJSONString,
  updateCustomSensitiveInformation
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EmailAddressInputTable, {
  initializeEmailAddresses
} from "components/EmailAddressInputTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import Model, { SENSITIVE_CUSTOM_FIELDS_PARENT } from "components/Model"
import "components/NameInput.css"
import NavigationWarning from "components/NavigationWarning"
import OptionListModal from "components/OptionListModal"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import SimilarObjectsModal from "components/SimilarObjectsModal"
import TriggerableConfirm from "components/TriggerableConfirm"
import { FastField, Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext, useEffect, useRef, useState } from "react"
import {
  Alert,
  Button,
  Col,
  FormCheck,
  FormGroup,
  FormLabel,
  FormSelect,
  Row
} from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Settings from "settings"
import { useDebouncedCallback } from "use-debounce"
import utils from "utils"
import PersonAvatar from "./Avatar"

const GQL_CREATE_PERSON = gql`
  mutation ($person: PersonInput!) {
    createPerson(person: $person) {
      uuid
    }
  }
`
const GQL_UPDATE_SELF = gql`
  mutation ($person: PersonInput!) {
    updateMe(person: $person)
  }
`
const GQL_UPDATE_PERSON = gql`
  mutation ($person: PersonInput!) {
    updatePerson(person: $person)
  }
`
const GQL_UPDATE_PERSON_AVATAR = gql`
  mutation ($person: PersonInput!) {
    updatePersonAvatar(person: $person)
  }
`
const GQL_GET_PERSON_COUNT = gql`
  query ($personQuery: PersonSearchQueryInput) {
    personList(query: $personQuery) {
      totalCount
    }
  }
`

const MIN_CHARS_FOR_DUPLICATES = 2

const PersonForm = ({
  edit,
  forOnboarding,
  title,
  saveText,
  initialValues,
  notesComponent
}) => {
  const { loadAppData, currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const confirmHasReplacementButton = useRef(null)
  const [error, setError] = useState(null)
  const [currentAvatarUuid, setCurrentAvatarUuid] = useState(
    initialValues?.avatarUuid
  )
  const [attachmentList, setAttachmentList] = useState(
    initialValues?.attachments
  )
  const [showWrongPersonModal, setShowWrongPersonModal] = useState(false)
  const [wrongPersonOptionValue, setWrongPersonOptionValue] = useState(null)
  const [showSimilarPeople, setShowSimilarPeople] = useState(false)
  const [showSimilarPeopleMessage, setShowSimilarPeopleMessage] =
    useState(false)
  const [personFirstName, setPersonFirstName] = useState(
    initialValues?.firstName
  )
  const [personLastName, setPersonLastName] = useState(initialValues?.lastName)
  // redirect first time users to the homepage in order to be able to use onboarding
  const [onSaveRedirectToHome, setOnSaveRedirectToHome] = useState(false)
  const attachmentsEnabled =
    !Settings.fields.attachment.featureDisabled && !forOnboarding
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser.isAdmin())
  initialValues.emailAddresses = initializeEmailAddresses(
    initialValues.emailAddresses
  )
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Model.STATUS.ACTIVE,
      label: "ACTIVE"
    },
    {
      id: "statusInactiveButton",
      value: Model.STATUS.INACTIVE,
      label: "INACTIVE"
    }
  ]
  const genderOptions = [
    {
      label: "Not Specified",
      value: "NOT SPECIFIED"
    },
    {
      label: "Male",
      value: "MALE"
    },
    {
      label: "Female",
      value: "FEMALE"
    }
  ]
  const checkPotentialDuplicatesDebounced = useDebouncedCallback(
    checkPotentialDuplicates,
    400
  )
  useEffect(() => {
    checkPotentialDuplicatesDebounced(personFirstName, personLastName)
  }, [checkPotentialDuplicatesDebounced, personFirstName, personLastName])

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Person.yupSchema}
      initialValues={initialValues}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        validateForm,
        submitForm
      }) => {
        const isSelf = Person.isEqual(currentUser, values)
        const isAdmin = currentUser && currentUser.isAdmin()
        const isPendingVerification = Person.isPendingVerification(values)
        const endOfTourDateInPast =
          values.endOfTourDate && values.endOfTourDate <= Date.now()
        const willAutoKickPosition =
          values.status === Model.STATUS.INACTIVE &&
          values.position &&
          !!values.position.uuid
        const authorizedSensitiveFields =
          currentUser &&
          Person.getAuthorizedSensitiveFields(
            currentUser,
            Person.customSensitiveInformation,
            values.position
          )
        const ranks = Settings.fields.person.ranks || []
        const countries = getCountries()
        if (countries.length === 1 && !values.country) {
          // Assign default country if there's only one
          values.country = countries[0]
        }
        // admins can edit all persons,
        // superusers for their organization hierarchy or position-less people,
        // and the user themselves when onboarding
        const canEditName =
          isAdmin ||
          currentUser?.hasAdministrativePermissionsForOrganization(
            values?.position?.organization
          ) ||
          (!values?.position?.uuid && currentUser?.isSuperuser()) ||
          ((isPendingVerification || !edit) && isSelf)
        // admins and superusers with edit permissions can change status to INACTIVE,
        // only admins can change back to ACTIVE (but nobody can change status of self!)
        const disableStatusChange =
          (initialValues.status === Model.STATUS.INACTIVE && !isAdmin) ||
          isPendingVerification ||
          isSelf
        const currentAvatar = attachmentList?.find(
          a => a.uuid === currentAvatarUuid
        )
        const otherAttachments = attachmentList?.filter(
          a => a.uuid !== currentAvatarUuid
        )
        const imageAttachments = attachmentList?.filter(a =>
          a.mimeType?.startsWith("image/")
        )
        const fullName = Person.fullName(Person.parseFullName(values.name))
        const nameMessage = "This is not " + (isSelf ? "me" : fullName)
        const modalTitle = `It is possible that the information of ${fullName} is out of date. Please help us identify if any of the following is the case:`
        const confirmLabel =
          wrongPersonOptionValue === "needNewAccount"
            ? "Yes, I would like to inactivate my predecessor's account and set up a new one for myself"
            : "Yes, I would like to inactivate this account"
        const action = (
          <>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              {saveText}
            </Button>
            {notesComponent}
          </>
        )

        return (
          <>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Form className="form-horizontal" method="post">
              <Messages error={error} />
              <Fieldset title={title} action={action} />
              <Fieldset>
                {/* Main Row for the first FieldSet */}
                <Row>
                  {edit && (
                    /* Col contains the avatar and edit button */
                    <Col sm={12} md={12} lg={4} xl={3} className="text-center">
                      <PersonAvatar
                        avatar={currentAvatar}
                        avatarUuid={currentAvatar?.uuid}
                      />
                      {(attachmentsEnabled && _isEmpty(imageAttachments) && (
                        <span>
                          <em>
                            Upload some image attachments first before setting
                            an avatar
                          </em>
                        </span>
                      )) || (
                        <div className="d-flex justify-content-around mt-3">
                          {currentAvatar && (
                            <ConfirmDestructive
                              onConfirm={updateAvatar}
                              operation="clear"
                              objectType="the avatar"
                              objectDisplay={`for ${values.name}`}
                              title="Clear avatar"
                              variant="outline-danger"
                              buttonSize="xs"
                            >
                              Clear avatar
                            </ConfirmDestructive>
                          )}
                          {attachmentEditEnabled && (
                            <AvatarEditModal
                              title={
                                currentAvatar
                                  ? "Set a new avatar"
                                  : "Set an avatar"
                              }
                              currentAvatar={currentAvatar}
                              images={imageAttachments}
                              onAvatarUpdate={onAvatarUpdate}
                            />
                          )}
                        </div>
                      )}
                    </Col>
                  )}
                  {/* Col contains the rest of the fields for the first FieldSet */}
                  <Col
                    lg={8}
                    xl={9}
                    className="d-flex flex-column justify-content-center"
                  >
                    <FormGroup>
                      <Row style={{ marginBottom: "1rem" }}>
                        <Col sm={2} as={FormLabel} htmlFor="lastName">
                          Name
                        </Col>
                        <Col sm={7}>
                          <Row>
                            <Col>
                              <DictionaryField
                                wrappedComponent={Field}
                                dictProps={Settings.fields.person.lastName}
                                name="lastName"
                                component={FieldHelper.InputFieldNoLabel}
                                display="inline"
                                disabled={!canEditName}
                                onKeyDown={handleLastNameOnKeyDown}
                                onChange={event => {
                                  setFieldValue("lastName", event.target.value)
                                  setPersonLastName(event.target.value)
                                }}
                              />
                            </Col>
                            ,
                            <Col>
                              <DictionaryField
                                wrappedComponent={Field}
                                dictProps={Settings.fields.person.firstName}
                                name="firstName"
                                component={FieldHelper.InputFieldNoLabel}
                                display="inline"
                                disabled={!canEditName}
                                onChange={event => {
                                  setFieldValue("firstName", event.target.value)
                                  setPersonFirstName(event.target.value)
                                }}
                              />
                            </Col>
                          </Row>
                        </Col>
                        {showSimilarPeopleMessage && (
                          <Col>
                            <Button
                              variant="outline-secondary"
                              onClick={() => setShowSimilarPeople(true)}
                            >
                              <Icon
                                icon={IconNames.WARNING_SIGN}
                                intent={Intent.WARNING}
                                size={IconSize.STANDARD}
                                style={{ margin: "0 6px" }}
                              />
                              Possible Duplicates
                            </Button>
                          </Col>
                        )}

                        {!forOnboarding && edit && (
                          <Col>
                            <TriggerableConfirm
                              onConfirm={async() => {
                                // Have to wait until field value is updated before we can submit the form
                                await setFieldValue(
                                  "status",
                                  Model.STATUS.INACTIVE
                                )
                                setOnSaveRedirectToHome(
                                  wrongPersonOptionValue === "needNewAccount"
                                )
                                await submitForm()
                              }}
                              title="Confirm to reset account"
                              body="Are you sure you want to reset this account?"
                              confirmText={confirmLabel}
                              cancelText="No, I am not entirely sure at this point"
                              variant="warning"
                              buttonLabel="Reset account"
                              buttonClassName="visually-hidden"
                              buttonRef={confirmHasReplacementButton}
                            />
                            <Button
                              id="wrongPerson"
                              variant="outline-secondary"
                              onClick={() => setShowWrongPersonModal(true)}
                            >
                              {nameMessage}
                            </Button>
                            <OptionListModal
                              title={modalTitle}
                              showModal={showWrongPersonModal}
                              onCancel={() => hideWrongPersonModal(null)}
                              onSuccess={optionValue =>
                                hideWrongPersonModal(optionValue)}
                            >
                              {(isSelf && (
                                <div>
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="needNewAccount"
                                    label={
                                      <>
                                        <em>{fullName}</em> has left and is
                                        replaced by me. I need to set up a new
                                        account.
                                      </>
                                    }
                                    id="wrongPerson-needNewAccount"
                                  />
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="haveAccount"
                                    label={
                                      <>
                                        <em>{fullName}</em> has left and is
                                        replaced by me. I already have an
                                        account.
                                      </>
                                    }
                                    id="wrongPerson-haveAccount"
                                  />
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="transferAccount"
                                    label={
                                      <>
                                        <em>{fullName}</em> is still active, but
                                        this should be my account.
                                      </>
                                    }
                                    id="wrongPerson-transferAccount"
                                  />
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="misspelledName"
                                    label={
                                      <>
                                        I am <em>{fullName}</em>, but my name is
                                        misspelled.
                                      </>
                                    }
                                    id="wrongPerson-misspelledName"
                                  />
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="otherError"
                                    label="Something else is wrong."
                                    id="wrongPerson-otherError"
                                  />
                                </div>
                              )) || (
                                <div>
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="leftVacant"
                                    label={
                                      <>
                                        <em>{fullName}</em> has left and the
                                        position is vacant.
                                      </>
                                    }
                                    id="wrongPerson-leftVacant"
                                  />
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="hasReplacement"
                                    label={
                                      <>
                                        <em>{fullName}</em> has left and has a
                                        replacement.
                                      </>
                                    }
                                    id="wrongPerson-hasReplacement"
                                  />
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="misspelledName"
                                    label={
                                      <>
                                        The name of <em>{fullName}</em> is
                                        misspelled.
                                      </>
                                    }
                                    id="wrongPerson-misspelledName"
                                  />
                                  <FormCheck
                                    type="radio"
                                    name="wrongPerson"
                                    value="otherError"
                                    label="Something else is wrong."
                                    id="wrongPerson-otherError"
                                  />
                                </div>
                              )}
                            </OptionListModal>
                          </Col>
                        )}
                      </Row>
                    </FormGroup>

                    {isAdmin && (
                      <>
                        <DictionaryField
                          wrappedComponent={FastField}
                          dictProps={Settings.fields.person.user}
                          name="user"
                          component={FieldHelper.RadioButtonToggleGroupField}
                          buttons={[
                            {
                              id: "isUser",
                              value: true,
                              label: "Yes"
                            },
                            {
                              id: "isNotUser",
                              value: false,
                              label: "No"
                            }
                          ]}
                          onChange={value => setFieldValue("user", value)}
                        >
                          {values.user && (
                            <Alert variant="warning">
                              Creating a user in ANET could result in duplicate
                              accounts if this person logs in later. If you
                              notice duplicate accounts you should take action.
                            </Alert>
                          )}
                        </DictionaryField>

                        {values.user && (
                          <DictionaryField
                            wrappedComponent={FastField}
                            dictProps={Settings.fields.person.domainUsername}
                            name="domainUsername"
                            component={FieldHelper.InputField}
                            extraColElem={
                              <span className="text-danger">
                                Be careful when changing this field; you might
                                lock someone out or create duplicate accounts.
                              </span>
                            }
                          />
                        )}
                      </>
                    )}

                    {disableStatusChange ? (
                      <DictionaryField
                        wrappedComponent={FastField}
                        dictProps={Settings.fields.person.status}
                        name="status"
                        component={FieldHelper.ReadonlyField}
                        humanValue={Person.humanNameOfStatus(values.status)}
                      />
                    ) : (
                      <DictionaryField
                        wrappedComponent={Field}
                        dictProps={Settings.fields.person.status}
                        name="status"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={statusButtons}
                        onChange={value => setFieldValue("status", value)}
                      >
                        {willAutoKickPosition && (
                          <Alert variant="warning">
                            Setting this person to inactive will automatically
                            remove them from the{" "}
                            <strong>{values.position.name}</strong> position.
                          </Alert>
                        )}
                      </DictionaryField>
                    )}
                  </Col>
                </Row>
              </Fieldset>

              <Fieldset title="Additional information">
                <DictionaryField
                  wrappedComponent={FastField}
                  as="div"
                  dictProps={Settings.fields.person.emailAddresses}
                  component={FieldHelper.SpecialField}
                  widget={
                    <EmailAddressInputTable
                      emailAddresses={values.emailAddresses}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.person.phoneNumber}
                  name="phoneNumber"
                  component={FieldHelper.InputField}
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.person.rank}
                  name="rank"
                  component={FieldHelper.SpecialField}
                  widget={
                    <FormSelect>
                      <option />
                      {ranks.map(rank => (
                        <option key={rank.value} value={rank.value}>
                          {rank.value}{" "}
                          {rank.description && ` - ( ${rank.description} )`}
                        </option>
                      ))}
                    </FormSelect>
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.person.gender}
                  name="gender"
                  component={FieldHelper.SpecialField}
                  widget={
                    <FormSelect>
                      <option />
                      {genderOptions.map(genderOption => (
                        <option
                          key={genderOption.value}
                          value={genderOption.value}
                        >
                          {genderOption.label}
                        </option>
                      ))}
                    </FormSelect>
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.person.country}
                  name="country"
                  component={FieldHelper.SpecialField}
                  widget={
                    <FormSelect>
                      <option />
                      {countries.map(country => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </FormSelect>
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.person.code}
                  name="code"
                  component={FieldHelper.InputField}
                  disabled={!isAdmin}
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.person.endOfTourDate}
                  name="endOfTourDate"
                  component={FieldHelper.SpecialField}
                  value={values.endOfTourDate}
                  onChange={value =>
                    setFieldValue(
                      "endOfTourDate",
                      value && moment(value).endOf("day").toDate()
                    )}
                  onBlur={() => setFieldTouched("endOfTourDate")}
                  widget={
                    <CustomDateInput id="endOfTourDate" canClearSelection />
                  }
                >
                  {endOfTourDateInPast && (
                    <Alert variant="warning">
                      Be aware that the end of tour date is in the past.
                    </Alert>
                  )}
                </DictionaryField>
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.person.biography}
                  name="biography"
                  component={FieldHelper.SpecialField}
                  value={values.biography}
                  onChange={value => {
                    // prevent initial unnecessary render of RichTextEditor
                    if (!_isEqual(value, values.biography)) {
                      setFieldValue("biography", value)
                    }
                  }}
                  onHandleBlur={() => {
                    // validation will be done by setFieldValue
                    setFieldTouched("biography", true, false)
                  }}
                  widget={
                    <RichTextEditor
                      className="biography"
                      placeholder={
                        Settings.fields.person.biography?.placeholder
                      }
                    />
                  }
                />

                {edit && attachmentEditEnabled && (
                  <Field
                    name="uploadAttachments"
                    label="Attachments"
                    component={FieldHelper.SpecialField}
                    widget={
                      <UploadAttachment
                        attachments={otherAttachments}
                        updateAttachments={a =>
                          setAttachmentList(
                            currentAvatar ? [currentAvatar, ...a] : a
                          )}
                        relatedObjectType={Person.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                      />
                    }
                    onHandleBlur={() => {
                      setFieldTouched("uploadAttachments", true, false)
                    }}
                  />
                )}
              </Fieldset>

              {!forOnboarding && !_isEmpty(Person.customFields) && (
                <Fieldset title="Person information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Person.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}

              {!forOnboarding && !_isEmpty(authorizedSensitiveFields) && (
                <Fieldset title="Sensitive information" id="sensitive-fields">
                  <CustomFieldsContainer
                    fieldsConfig={authorizedSensitiveFields}
                    parentFieldName={SENSITIVE_CUSTOM_FIELDS_PARENT}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}
              {showSimilarPeople && (
                <SimilarObjectsModal
                  objectType="Person"
                  userInput={`${values.lastName} ${values.firstName}`}
                  onCancel={() => {
                    setShowSimilarPeople(false)
                  }}
                />
              )}

              <div className="submit-buttons">
                <div>
                  <Button variant="outline-secondary" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    id="formBottomSubmit"
                    variant="primary"
                    onClick={submitForm}
                    disabled={isSubmitting}
                  >
                    {saveText}
                  </Button>
                </div>
              </div>
            </Form>
          </>
        )
      }}
    </Formik>
  )

  function getCountries() {
    return Settings.fields.regular.person.countries
  }

  async function updateAvatar(newAvatarUuid) {
    await API.mutation(GQL_UPDATE_PERSON_AVATAR, {
      person: { uuid: initialValues.uuid, avatarUuid: newAvatarUuid }
    })
      .then(() => {
        toast.success(`Avatar ${newAvatarUuid ? "updated" : "deleted"}`)
        setCurrentAvatarUuid(newAvatarUuid)
        loadAppData() // avatar was changed!
      })
      .catch(error =>
        toast.error(
          `Avatar ${newAvatarUuid ? "update" : "delete"} failed: ${
            error.message
          }`
        )
      )
  }

  async function onAvatarUpdate(chosenImage, data) {
    const mimeType = "image/png"
    const baseName = utils.stripExtension(chosenImage.fileName)
    const newAvatar = await attachmentSave(
      `${baseName}.png`,
      mimeType,
      data.length,
      initialValues.name,
      new Blob([data], { type: mimeType }),
      Person.relatedObjectType,
      initialValues.uuid,
      attachmentList,
      setAttachmentList
    )
    if (newAvatar?.uuid) {
      await updateAvatar(newAvatar?.uuid)
    }
  }

  function handleLastNameOnKeyDown(event) {
    // adding a "," to the last name results in jumping to the end of the first name
    if (event.key === ",") {
      event.preventDefault()
      document.getElementById("firstName").focus()
    }
  }

  function onCancel() {
    navigate(-1)
  }

  function onSubmit(values, form) {
    save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (onSaveRedirectToHome) {
      localStorage.clear()
      localStorage.newUser = "true"
      loadAppData()
      navigate("/")
    } else {
      const updateOperation = forOnboarding ? "updateMe" : "updatePerson"
      const operation = edit ? updateOperation : "createPerson"
      const person = new Person({
        uuid: response[operation].uuid
          ? response[operation].uuid
          : initialValues.uuid
      })
      if (Person.isEqual(currentUser, values)) {
        loadAppData()
      }
      if (forOnboarding && !Settings.automaticallyAllowAllNewUsers) {
        navigate("/onboarding/show", {
          state: { success: "Your profile was updated" }
        })
      } else {
        if (!edit) {
          navigate(Person.pathForEdit(person), { replace: true })
        }
        navigate(Person.pathFor(person), {
          state: { success: "Person saved" }
        })
      }
    }
  }

  function save(values, form) {
    values.avatarUuid = currentAvatarUuid
    const person = Person.filterClientSideFields(new Person(values))
    if (values.pendingVerification && Settings.automaticallyAllowAllNewUsers) {
      person.pendingVerification = false
    }
    person.name = Person.fullName(
      { firstName: values.firstName, lastName: values.lastName },
      true
    )
    person.customSensitiveInformation = updateCustomSensitiveInformation(values)
    person.customFields = customFieldsJSONString(values)
    const updateMutation = forOnboarding ? GQL_UPDATE_SELF : GQL_UPDATE_PERSON
    return API.mutation(edit ? updateMutation : GQL_CREATE_PERSON, {
      person
    })
  }

  function hideWrongPersonModal(optionValue) {
    setShowWrongPersonModal(false)
    setWrongPersonOptionValue(optionValue)
    if (optionValue) {
      // do something useful with optionValue
      switch (optionValue) {
        case "needNewAccount":
        case "leftVacant":
        case "hasReplacement":
          // reset account?
          confirmHasReplacementButton.current.click()
          break
        default:
          // TODO: integrate action to email admin
          alert(
            "Please contact your administrator " + Settings.SUPPORT_EMAIL_ADDR
          )
          break
      }
    }
  }
  async function checkPotentialDuplicates(firstName, lastName) {
    if (
      !forOnboarding &&
      !edit &&
      (firstName.length >= MIN_CHARS_FOR_DUPLICATES ||
        lastName.length >= MIN_CHARS_FOR_DUPLICATES)
    ) {
      const personQuery = {
        pageSize: 1,
        text: `${firstName} ${lastName}`
      }
      try {
        const response = await API.query(GQL_GET_PERSON_COUNT, {
          personQuery
        })
        setError(null)
        setShowSimilarPeopleMessage(response?.personList.totalCount > 0)
      } catch (error) {
        setError(error)
        setShowSimilarPeopleMessage(false)
        jumpToTop()
      }
    } else {
      setError(null)
      setShowSimilarPeopleMessage(false)
    }
  }
}

PersonForm.propTypes = {
  initialValues: PropTypes.instanceOf(Person).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  forOnboarding: PropTypes.bool,
  saveText: PropTypes.string,
  notesComponent: PropTypes.node
}

PersonForm.defaultProps = {
  title: "",
  edit: false,
  forOnboarding: false,
  saveText: "Save Person"
}

export default PersonForm
