import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import AvatarEditModal from "components/AvatarEditModal"
import CustomDateInput from "components/CustomDateInput"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import "components/NameInput.css"
import NavigationWarning from "components/NavigationWarning"
import OptionListModal from "components/OptionListModal"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import TriggerableConfirm from "components/TriggerableConfirm"
import { FastField, Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useRef, useState } from "react"
import {
  Alert,
  Button,
  Col,
  ControlLabel,
  FormGroup,
  HelpBlock,
  Radio
} from "react-bootstrap"
import { useHistory } from "react-router-dom"
import Settings from "settings"

const GQL_CREATE_PERSON = gql`
  mutation($person: PersonInput!) {
    createPerson(person: $person) {
      uuid
    }
  }
`
const GQL_UPDATE_PERSON = gql`
  mutation($person: PersonInput!) {
    updatePerson(person: $person)
  }
`

const PersonForm = ({ edit, title, saveText, initialValues }) => {
  const { loadAppData, currentUser } = useContext(AppContext)
  const history = useHistory()
  const confirmHasReplacementButton = useRef(null)
  const [error, setError] = useState(null)
  const [currentAvatar, setCurrentAvatar] = useState(initialValues.avatar)
  const [showWrongPersonModal, setShowWrongPersonModal] = useState(false)
  const [wrongPersonOptionValue, setWrongPersonOptionValue] = useState(null)
  // redirect first time users to the homepage in order to be able to use onboarding
  const [onSaveRedirectToHome, setOnSaveRedirectToHome] = useState(
    Person.isPendingVerification(initialValues)
  )
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Person.STATUS.ACTIVE,
      label: "ACTIVE"
    },
    {
      id: "statusInactiveButton",
      value: Person.STATUS.INACTIVE,
      label: "INACTIVE"
    }
  ]
  const advisorSingular = Settings.fields.advisor.person.name
  const advisorPlural = pluralize(advisorSingular)
  const userRoleButtons = [
    {
      id: "roleAdvisorButton",
      title: `Super users cannot create ${advisorSingular} profiles. ANET uses the domain user name to authenticate and uniquely identify each ANET user. To ensure that ${advisorPlural} have the correct domain name associated with their profile, it is required that each new ${advisorSingular} individually logs into ANET and creates their own ANET profile.`,
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

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Person.yupSchema}
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
          values.status === Person.STATUS.INACTIVE &&
          values.position &&
          !!values.position.uuid
        const warnDomainUsername =
          values.status === Person.STATUS.INACTIVE &&
          !_isEmpty(values.domainUsername)
        const ranks = Settings.fields.person.ranks || []
        const roleButtons = isAdmin ? adminRoleButtons : userRoleButtons
        const countries = getCountries(values.role)
        if (countries.length === 1 && !values.country) {
          // Assign default country if there's only one
          values.country = countries[0]
        }
        // anyone with edit permissions can change status to INACTIVE, only admins can change back to ACTIVE (but nobody can change status of self!)
        const disableStatusChange =
          (initialValues.status === Person.STATUS.INACTIVE && !isAdmin) ||
          isSelf
        // admins can edit all persons, new users can be edited by super users or themselves
        const canEditName =
          isAdmin ||
          ((isPendingVerification || !edit) &&
            currentUser &&
            (currentUser.isSuperUser() || isSelf))
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
              bsStyle="primary"
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              {saveText}
            </Button>
          </>
        )

        return (
          <>
            <NavigationWarning isBlocking={dirty} />
            <Form className="form-horizontal" method="post">
              <Messages error={error} />
              <Fieldset title={title} action={action} />
              <Fieldset>
                <AvatarDisplayComponent
                  avatar={currentAvatar}
                  height={256}
                  width={256}
                />
                <AvatarEditModal
                  title="Edit avatar"
                  onAvatarUpdate={onAvatarUpdate}
                />
                <FormGroup>
                  <Col sm={2} componentClass={ControlLabel} htmlFor="lastName">
                    Name
                  </Col>
                  <Col sm={7}>
                    <Col sm={5}>
                      <FastField
                        name="lastName"
                        component={FieldHelper.InputFieldNoLabel}
                        display="inline"
                        placeholder="LAST NAME"
                        disabled={!canEditName}
                        onKeyDown={handleLastNameOnKeyDown}
                      />
                    </Col>
                    <Col sm={1} className="name-input">
                      ,
                    </Col>
                    <Col sm={6}>
                      <FastField
                        name="firstName"
                        component={FieldHelper.InputFieldNoLabel}
                        display="inline"
                        placeholder="First name(s) - Lower-case except for the first letter of each name"
                        disabled={!canEditName}
                      />
                    </Col>
                  </Col>

                  {edit && (
                    <>
                      <TriggerableConfirm
                        onConfirm={async() => {
                          // Have to wait until field value is updated before we can submit the form
                          await setFieldValue("status", Person.STATUS.INACTIVE)
                          setOnSaveRedirectToHome(
                            wrongPersonOptionValue === "needNewAccount"
                          )
                          submitForm()
                        }}
                        title="Confirm to reset account"
                        body="Are you sure you want to reset this account?"
                        confirmText={confirmLabel}
                        cancelText="No, I am not entirely sure at this point"
                        bsStyle="warning"
                        buttonLabel="Reset account"
                        className="hidden"
                        buttonRef={confirmHasReplacementButton}
                      />
                      <Button
                        id="wrongPerson"
                        onClick={() => setShowWrongPersonModal(true)}
                      >
                        {nameMessage}
                      </Button>
                      <OptionListModal
                        title={modalTitle}
                        showModal={showWrongPersonModal}
                        onCancel={optionValue =>
                          hideWrongPersonModal(optionValue)}
                        onSuccess={optionValue =>
                          hideWrongPersonModal(optionValue)}
                      >
                        {(isSelf && (
                          <div>
                            <Radio name="wrongPerson" value="needNewAccount">
                              <em>{fullName}</em> has left and is replaced by
                              me. I need to set up a new account.
                            </Radio>
                            <Radio name="wrongPerson" value="haveAccount">
                              <em>{fullName}</em> has left and is replaced by
                              me. I already have an account.
                            </Radio>
                            <Radio name="wrongPerson" value="transferAccount">
                              <em>{fullName}</em> is still active, but this
                              should be my account.
                            </Radio>
                            <Radio name="wrongPerson" value="misspelledName">
                              I am <em>{fullName}</em>, but my name is
                              misspelled.
                            </Radio>
                            <Radio name="wrongPerson" value="otherError">
                              Something else is wrong.
                            </Radio>
                          </div>
                        )) || (
                          <div>
                            <Radio name="wrongPerson" value="leftVacant">
                              <em>{fullName}</em> has left and the position is
                              vacant.
                            </Radio>
                            <Radio name="wrongPerson" value="hasReplacement">
                              <em>{fullName}</em> has left and has a
                              replacement.
                            </Radio>
                            <Radio name="wrongPerson" value="misspelledName">
                              The name of <em>{fullName}</em> is misspelled.
                            </Radio>
                            <Radio name="wrongPerson" value="otherError">
                              Something else is wrong.
                            </Radio>
                          </div>
                        )}
                      </OptionListModal>
                    </>
                  )}
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
                      <Alert bsStyle="warning">
                        Creating a {Settings.fields.advisor.person.name} in ANET
                        could result in duplicate accounts if this person logs
                        in later. If you notice duplicate accounts, please
                        contact an ANET administrator.
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
                      <HelpBlock>
                        <span className="text-danger">
                          Setting this person to inactive will automatically
                          remove them from the{" "}
                          <strong>{values.position.name}</strong> position.
                        </span>
                      </HelpBlock>
                    )}
                    {warnDomainUsername && (
                      <HelpBlock>
                        <span className="text-danger">
                          Setting this person to inactive means the next person
                          to logon with the user name{" "}
                          <strong>{values.domainUsername}</strong> will have to
                          create a new profile. Do you want the next person to
                          login with this user name to create a new profile?
                        </span>
                      </HelpBlock>
                    )}
                  </Field>
                )}
              </Fieldset>

              <Fieldset title="Additional information">
                <FastField
                  name="emailAddress"
                  label={Settings.fields.person.emailAddress}
                  type="email"
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
                    <FastField component="select" className="form-control">
                      <option />
                      {ranks.map(rank => (
                        <option key={rank.value} value={rank.value}>
                          {rank.value}{" "}
                          {rank.description && ` - ( ${rank.description} )`}
                        </option>
                      ))}
                    </FastField>
                  }
                />
                <FastField
                  name="gender"
                  label={Settings.fields.person.gender}
                  component={FieldHelper.SpecialField}
                  widget={
                    <FastField component="select" className="form-control">
                      <option />
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </FastField>
                  }
                />
                <FastField
                  name="country"
                  label={Settings.fields.person.country}
                  component={FieldHelper.SpecialField}
                  widget={
                    <FastField component="select" className="form-control">
                      <option />
                      {countries.map(country => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </FastField>
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
                    <Alert bsStyle="warning">
                      Be aware that the end of tour date is in the past.
                    </Alert>
                  )}
                </FastField>
                <FastField
                  name="biography"
                  component={FieldHelper.SpecialField}
                  onChange={value => setFieldValue("biography", value)}
                  widget={
                    <RichTextEditor
                      className="biography"
                      onHandleBlur={() => {
                        // validation will be done by setFieldValue
                        setFieldTouched("biography", true, false)
                      }}
                    />
                  }
                />
              </Fieldset>

              {Settings.fields.person.customFields && (
                <Fieldset title="Person information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.person.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel}>Cancel</Button>
                </div>
                <div>
                  <Button
                    id="formBottomSubmit"
                    bsStyle="primary"
                    type="button"
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
    history.goBack()
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
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    if (onSaveRedirectToHome) {
      localStorage.clear()
      localStorage.newUser = "true"
      loadAppData()
      history.push("/")
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
        history.replace(Person.pathForEdit(person))
      }
      history.push(Person.pathFor(person), {
        success: "Person saved"
      })
    }
  }

  function save(values, form) {
    values.avatar = currentAvatar
    const person = Object.without(
      new Person(values),
      "notes",
      "firstName",
      "lastName",
      "customFields", // initial JSON from the db
      DEFAULT_CUSTOM_FIELDS_PARENT
    )
    if (values.isPendingVerification) {
      person.pendingVerification = false
    }
    person.name = Person.fullName(
      { firstName: values.firstName, lastName: values.lastName },
      true
    )
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
          confirmHasReplacementButton.current.props.onClick()
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
  saveText: PropTypes.string
}

PersonForm.defaultProps = {
  title: "",
  edit: false,
  saveText: "Save Person"
}

export default PersonForm
