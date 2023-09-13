import { gql } from "@apollo/client"
import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AppContext from "components/AppContext"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import AvatarEditModal from "components/AvatarEditModal"
import CustomDateInput from "components/CustomDateInput"
import {
  CustomFieldsContainer,
  customFieldsJSONString,
  updateCustomSensitiveInformation
} from "components/CustomFields"
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
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useRef, useState } from "react"
import {
  Alert,
  Button,
  Col,
  FormCheck,
  FormGroup,
  FormLabel,
  FormSelect,
  FormText,
  Row
} from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import Settings from "settings"

const GQL_CREATE_PERSON = gql`
  mutation ($person: PersonInput!) {
    createPerson(person: $person) {
      uuid
    }
  }
`
const GQL_UPDATE_PERSON = gql`
  mutation ($person: PersonInput!) {
    updatePerson(person: $person)
  }
`
const MIN_CHARS_FOR_DUPLICATES = 2

const PersonForm = ({
  edit,
  title,
  saveText,
  initialValues,
  notesComponent
}) => {
  const { loadAppData, currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const confirmHasReplacementButton = useRef(null)
  const [error, setError] = useState(null)
  const [currentAvatar, setCurrentAvatar] = useState(initialValues.avatar)
  const [showWrongPersonModal, setShowWrongPersonModal] = useState(false)
  const [wrongPersonOptionValue, setWrongPersonOptionValue] = useState(null)
  const [showSimilarPeople, setShowSimilarPeople] = useState(false)
  // redirect first time users to the homepage in order to be able to use onboarding
  const [onSaveRedirectToHome, setOnSaveRedirectToHome] = useState(
    Person.isPendingVerification(initialValues)
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
  const advisorSingular = Settings.fields.advisor.person.name
  const advisorPlural = pluralize(advisorSingular)
  const userRoleButtons = [
    {
      id: "roleAdvisorButton",
      title: `Superusers cannot create ${advisorSingular} profiles. ANET uses the domain user name to authenticate and uniquely identify each ANET user. To ensure that ${advisorPlural} have the correct domain name associated with their profile, it is required that each new ${advisorSingular} individually logs into ANET and creates their own ANET profile.`,
      value: Person.ROLE.ADVISOR,
      label: Settings.fields.advisor.person.name,
      disabled: true
    },
    {
      id: "rolePrincipalButton",
      value: Person.ROLE.PRINCIPAL,
      label: Settings.fields.principal.person.name
    }
  ]
  const adminRoleButtons = [
    {
      id: "roleAdvisorButton",
      title: null,
      value: Person.ROLE.ADVISOR,
      label: Settings.fields.advisor.person.name,
      disabled: false
    },
    {
      id: "rolePrincipalButton",
      value: Person.ROLE.PRINCIPAL,
      label: Settings.fields.principal.person.name
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
        const isAdvisor = Person.isAdvisor(values)
        const isPendingVerification = Person.isPendingVerification(values)
        const endOfTourDateInPast = values.endOfTourDate
          ? values.endOfTourDate <= Date.now()
          : false
        const willAutoKickPosition =
          values.status === Model.STATUS.INACTIVE &&
          values.position &&
          !!values.position.uuid
        const warnDomainUsername =
          values.status === Model.STATUS.INACTIVE &&
          !_isEmpty(values.domainUsername)
        const authorizedSensitiveFields =
          currentUser &&
          Person.getAuthorizedSensitiveFields(
            currentUser,
            Person.customSensitiveInformation,
            values.position
          )
        const ranks = Settings.fields.person.ranks || []
        const roleButtons = isAdmin ? adminRoleButtons : userRoleButtons
        const countries = getCountries(values.role)
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
          (initialValues.status === Model.STATUS.INACTIVE && !isAdmin) || isSelf
        const fullName = Person.fullName(Person.parseFullName(values.name))
        const nameMessage = "This is not " + (isSelf ? "me" : fullName)
        const modalTitle = `It is possible that the information of ${fullName} is out of date. Please help us identify if any of the following is the case:`
        const confirmLabel =
          wrongPersonOptionValue === "needNewAccount"
            ? "Yes, I would like to inactivate my predecessor's account and set up a new one for myself"
            : "Yes, I would like to inactivate this account"
        const action = (
          <div>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              {saveText}
            </Button>
            {notesComponent}
          </div>
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
                  {/* Col contains the avatar and edit button */}
                  <Col sm={12} md={12} lg={4} xl={3} className="text-center">
                    <AvatarDisplayComponent
                      avatar={currentAvatar}
                      height={256}
                      width={256}
                    />
                    <AvatarEditModal
                      title="Edit avatar"
                      onAvatarUpdate={onAvatarUpdate}
                    />
                  </Col>
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
                              <FastField
                                name="lastName"
                                component={FieldHelper.InputFieldNoLabel}
                                display="inline"
                                placeholder="LAST NAME"
                                disabled={!canEditName}
                                onKeyDown={handleLastNameOnKeyDown}
                              />
                            </Col>
                            ,
                            <Col>
                              <FastField
                                name="firstName"
                                component={FieldHelper.InputFieldNoLabel}
                                display="inline"
                                placeholder="First name(s) - Lower-case except for the first letter of each name"
                                disabled={!canEditName}
                              />
                            </Col>
                          </Row>
                        </Col>
                        {!edit &&
                          values.firstName.length >= MIN_CHARS_FOR_DUPLICATES &&
                          values.lastName.length >=
                            MIN_CHARS_FOR_DUPLICATES && (
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

                        {edit && (
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
                                submitForm()
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
                      <FastField
                        name="domainUsername"
                        component={FieldHelper.InputField}
                        extraColElem={
                          <span className="text-danger">
                            Be careful when changing this field; you might lock
                            someone out or create duplicate accounts.
                          </span>
                        }
                      />
                    )}

                    {edit ? (
                      <FastField
                        name="role"
                        component={FieldHelper.ReadonlyField}
                        humanValue={Person.humanNameOfRole(values.role)}
                      />
                    ) : (
                      <FastField
                        name="role"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={roleButtons}
                        onChange={value => {
                          const roleCountries = getCountries(value)
                          // Reset country value on role change
                          if (roleCountries.length === 1) {
                            // Assign default country if there's only one
                            setFieldValue("country", roleCountries[0])
                          } else {
                            setFieldValue("country", "")
                          }
                          setFieldValue("role", value)
                        }}
                      >
                        {isAdvisor && (
                          <Alert variant="warning">
                            Creating a {Settings.fields.advisor.person.name} in
                            ANET could result in duplicate accounts if this
                            person logs in later. If you notice duplicate
                            accounts, please contact an ANET administrator.
                          </Alert>
                        )}
                      </FastField>
                    )}

                    {disableStatusChange ? (
                      <FastField
                        name="status"
                        component={FieldHelper.ReadonlyField}
                        humanValue={Person.humanNameOfStatus(values.status)}
                      />
                    ) : isPendingVerification ? (
                      <FastField
                        name="status"
                        component={FieldHelper.ReadonlyField}
                        humanValue={Person.humanNameOfStatus(values.status)}
                      />
                    ) : (
                      <Field
                        name="status"
                        component={FieldHelper.RadioButtonToggleGroupField}
                        buttons={statusButtons}
                        onChange={value => setFieldValue("status", value)}
                      >
                        {willAutoKickPosition && (
                          <FormText>
                            <span className="text-danger">
                              Setting this person to inactive will automatically
                              remove them from the{" "}
                              <strong>{values.position.name}</strong> position.
                            </span>
                          </FormText>
                        )}
                        {warnDomainUsername && (
                          <FormText>
                            <span className="text-danger">
                              Setting this person to inactive means the next
                              person to logon with the user name{" "}
                              <strong>{values.domainUsername}</strong> will have
                              to create a new profile. Do you want the next
                              person to login with this user name to create a
                              new profile?
                            </span>
                          </FormText>
                        )}
                      </Field>
                    )}
                  </Col>
                </Row>
              </Fieldset>

              <Fieldset title="Additional information">
                <FastField
                  name="emailAddress"
                  label={Settings.fields.person.emailAddress.label}
                  type="email"
                  placeholder={
                    values.role === Person.ROLE.ADVISOR
                      ? Settings.fields.person.emailAddress.placeholder
                      : ""
                  }
                  component={FieldHelper.InputField}
                />
                <FastField
                  name="phoneNumber"
                  label={Settings.fields.person.phoneNumber}
                  component={FieldHelper.InputField}
                />
                <FastField
                  name="rank"
                  label={Settings.fields.person.rank}
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
                <FastField
                  name="gender"
                  label={Settings.fields.person.gender}
                  component={FieldHelper.SpecialField}
                  widget={
                    <FormSelect>
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
                <FastField
                  name="country"
                  label={Settings.fields.person.country}
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
                <FastField
                  name="code"
                  label={Settings.fields.person.code}
                  component={FieldHelper.InputField}
                  disabled={!isAdmin}
                />
                <FastField
                  name="endOfTourDate"
                  label={Settings.fields.person.endOfTourDate}
                  component={FieldHelper.SpecialField}
                  value={values.endOfTourDate}
                  onChange={value => setFieldValue("endOfTourDate", value)}
                  onBlur={() => setFieldTouched("endOfTourDate")}
                  widget={<CustomDateInput id="endOfTourDate" />}
                >
                  {isAdvisor && endOfTourDateInPast && (
                    <Alert variant="warning">
                      Be aware that the end of tour date is in the past.
                    </Alert>
                  )}
                </FastField>
                <FastField
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
                  widget={<RichTextEditor className="biography" />}
                />
              </Fieldset>

              {!_isEmpty(Person.customFields) && (
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

              {!_isEmpty(authorizedSensitiveFields) && (
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

  function getCountries(role) {
    switch (role) {
      case Person.ROLE.ADVISOR:
        return Settings.fields.advisor.person.countries
      case Person.ROLE.PRINCIPAL:
        return Settings.fields.principal.person.countries
      default:
        return []
    }
  }

  function onAvatarUpdate(updatedAvatar) {
    setCurrentAvatar(updatedAvatar)
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
      const operation = edit ? "updatePerson" : "createPerson"
      const person = new Person({
        uuid: response[operation].uuid
          ? response[operation].uuid
          : initialValues.uuid
      })
      if (Person.isEqual(currentUser, values)) {
        loadAppData()
      }
      if (!edit) {
        navigate(Person.pathForEdit(person), { replace: true })
      }
      navigate(Person.pathFor(person), {
        state: { success: "Person saved" }
      })
    }
  }

  function save(values, form) {
    values.avatar = currentAvatar
    const person = Person.filterClientSideFields(new Person(values))
    if (values.pendingVerification) {
      person.pendingVerification = false
    }
    person.name = Person.fullName(
      { firstName: values.firstName, lastName: values.lastName },
      true
    )
    person.customSensitiveInformation = updateCustomSensitiveInformation(values)
    person.customFields = customFieldsJSONString(values)
    return API.mutation(edit ? GQL_UPDATE_PERSON : GQL_CREATE_PERSON, {
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
}

PersonForm.propTypes = {
  initialValues: PropTypes.instanceOf(Person).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  saveText: PropTypes.string,
  notesComponent: PropTypes.node
}

PersonForm.defaultProps = {
  title: "",
  edit: false,
  saveText: "Save Person"
}

export default PersonForm
