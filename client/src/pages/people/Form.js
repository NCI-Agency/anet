import API, { Settings } from "api"
import AppContext from "components/AppContext"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import "components/NameInput.css"
import NavigationWarning from "components/NavigationWarning"
import OptionListModal from "components/OptionListModal"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import TriggerableConfirm from "components/TriggerableConfirm"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { Component } from "react"
import {
  Alert,
  Button,
  Col,
  ControlLabel,
  FormGroup,
  HelpBlock,
  Radio
} from "react-bootstrap"
import { withRouter } from "react-router-dom"

class BasePersonForm extends Component {
  static propTypes = {
    initialValues: PropTypes.object.isRequired,
    title: PropTypes.string,
    edit: PropTypes.bool,
    saveText: PropTypes.string,
    currentUser: PropTypes.instanceOf(Person),
    loadAppData: PropTypes.func
  }

  static defaultProps = {
    initialValues: new Person(),
    title: "",
    edit: false,
    saveText: "Save Person"
  }

  statusButtons = [
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
  advisorSingular = Settings.fields.advisor.person.name
  advisorPlural = pluralize(this.advisorSingular)
  roleButtons = [
    {
      id: "roleAdvisorButton",
      title: `Super users cannot create ${
        this.advisorSingular
      } profiles. ANET uses the domain user name to authenticate and uniquely identify each ANET user. To ensure that ${
        this.advisorPlural
      } have the correct domain name associated with their profile, it is required that each new ${
        this.advisorSingular
      } individually logs into ANET and creates their own ANET profile.`,
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
  adminRoleButtons = [
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
  countries = role => {
    switch (role) {
      case Person.ROLE.ADVISOR:
        return Settings.fields.advisor.person.countries
      case Person.ROLE.PRINCIPAL:
        return Settings.fields.principal.person.countries
      default:
        return []
    }
  }
  state = {
    success: null,
    originalStatus: "",
    showWrongPersonModal: false,
    wrongPersonOptionValue: null,
    onSaveRedirectToHome: Person.isNewUser(this.props.initialValues) // redirect first time users to the homepage in order to be able to use onboarding
  }

  render() {
    const { currentUser, edit, title, ...myFormProps } = this.props
    return (
      <Formik
        enableReinitialize
        onSubmit={this.onSubmit}
        validationSchema={Person.yupSchema}
        isInitialValid
        {...myFormProps}
      >
        {({
          handleSubmit,
          isSubmitting,
          dirty,
          errors,
          setFieldValue,
          setFieldTouched,
          values,
          submitForm
        }) => {
          const isSelf = Person.isEqual(currentUser, values)
          const isAdmin = currentUser && currentUser.isAdmin()
          const isAdvisor = Person.isAdvisor(values)
          const isNewUser = Person.isNewUser(values)
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
          const roleButtons = isAdmin ? this.adminRoleButtons : this.roleButtons
          const countries = this.countries(values.role)
          if (countries.length === 1 && !values.country) {
            // Assign default country if there's only one
            values.country = countries[0]
          }
          // anyone with edit permissions can change status to INACTIVE, only admins can change back to ACTIVE (but nobody can change status of self!)
          const disableStatusChange =
            (this.props.initialValues.status === Person.STATUS.INACTIVE &&
              !isAdmin) ||
            isSelf
          // admins can edit all persons, new users can be edited by super users or themselves
          const canEditName =
            isAdmin ||
            ((isNewUser || !edit) &&
              currentUser &&
              (currentUser.isSuperUser() || isSelf))
          const fullName = Person.fullName(Person.parseFullName(values.name))
          const nameMessage = "This is not " + (isSelf ? "me" : fullName)
          const modalTitle = `It is possible that the information of ${fullName} is out of date. Please help us identify if any of the following is the case:`
          const confirmLabel =
            this.state.wrongPersonOptionValue === "needNewAccount"
              ? "Yes, I would like to inactivate my predecessor's account and set up a new one for myself"
              : "Yes, I would like to inactivate this account"
          const action = (
            <React.Fragment>
              <Button
                key="submit"
                bsStyle="primary"
                type="button"
                onClick={submitForm}
                disabled={isSubmitting}
              >
                {this.props.saveText}
              </Button>
            </React.Fragment>
          )

          return (
            <React.Fragment>
              <NavigationWarning isBlocking={dirty} />
              <Form className="form-horizontal" method="post">
                <Messages error={this.state.error} />
                <Fieldset title={this.props.title} action={action} />
                <Fieldset>
                  <FormGroup>
                    <Col
                      sm={2}
                      componentClass={ControlLabel}
                      htmlFor="lastName"
                    >
                      Name
                    </Col>
                    <Col sm={7}>
                      <Col sm={5}>
                        <Field
                          name="lastName"
                          component={FieldHelper.renderInputFieldNoLabel}
                          display="inline"
                          placeholder="LAST NAME"
                          disabled={!canEditName}
                          onKeyDown={this.handleLastNameOnKeyDown}
                        />
                      </Col>
                      <Col sm={1} className="name-input">
                        ,
                      </Col>
                      <Col sm={6}>
                        <Field
                          name="firstName"
                          component={FieldHelper.renderInputFieldNoLabel}
                          display="inline"
                          placeholder="First name(s) - Lower-case except for the first letter of each name"
                          disabled={!canEditName}
                        />
                      </Col>
                    </Col>

                    {edit && !canEditName && (
                      <React.Fragment>
                        <TriggerableConfirm
                          onConfirm={() => {
                            setFieldValue("status", Person.STATUS.INACTIVE)
                            this.setState(
                              {
                                onSaveRedirectToHome:
                                  this.state.wrongPersonOptionValue ===
                                  "needNewAccount"
                              },
                              submitForm
                            )
                          }}
                          title="Confirm to reset account"
                          body="Are you sure you want to reset this account?"
                          confirmText={confirmLabel}
                          cancelText="No, I am not entirely sure at this point"
                          bsStyle="warning"
                          buttonLabel="Reset account"
                          className="hidden"
                          ref={confirmComponent =>
                            (this.confirmHasReplacementButton = confirmComponent)
                          }
                        />
                        <Button
                          id="wrongPerson"
                          onClick={this.showWrongPersonModal}
                        >
                          {nameMessage}
                        </Button>
                        <OptionListModal
                          title={modalTitle}
                          showModal={this.state.showWrongPersonModal}
                          onCancel={optionValue =>
                            this.hideWrongPersonModal(optionValue)
                          }
                          onSuccess={optionValue =>
                            this.hideWrongPersonModal(optionValue)
                          }
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
                      </React.Fragment>
                    )}
                  </FormGroup>

                  {isAdmin && (
                    <Field
                      name="domainUsername"
                      component={FieldHelper.renderInputField}
                      extraColElem={
                        <span className="text-danger">
                          Be careful when changing this field; you might lock
                          someone out or create duplicate accounts.
                        </span>
                      }
                    />
                  )}

                  {edit ? (
                    <Field
                      name="role"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={Person.humanNameOfRole(values.role)}
                    />
                  ) : (
                    <Field
                      name="role"
                      component={FieldHelper.renderButtonToggleGroup}
                      buttons={roleButtons}
                      onChange={value => {
                        const roleCountries = this.countries(value)
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
                      {!edit && isAdvisor && (
                        <Alert bsStyle="warning">
                          Creating a {Settings.fields.advisor.person.name} in
                          ANET could result in duplicate accounts if this person
                          logs in later. If you notice duplicate accounts,
                          please contact an ANET administrator.
                        </Alert>
                      )}
                    </Field>
                  )}

                  {disableStatusChange ? (
                    <Field
                      name="status"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={Person.humanNameOfStatus(values.status)}
                    />
                  ) : isNewUser ? (
                    <Field
                      name="status"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={Person.humanNameOfStatus(values.status)}
                    />
                  ) : (
                    <Field
                      name="status"
                      component={FieldHelper.renderButtonToggleGroup}
                      buttons={this.statusButtons}
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
                            Setting this person to inactive means the next
                            person to logon with the user name{" "}
                            <strong>{values.domainUsername}</strong> will have
                            to create a new profile. Do you want the next person
                            to login with this user name to create a new
                            profile?
                          </span>
                        </HelpBlock>
                      )}
                    </Field>
                  )}
                </Fieldset>

                <Fieldset title="Additional information">
                  <Field
                    name="emailAddress"
                    label={Settings.fields.person.emailAddress}
                    type="email"
                    component={FieldHelper.renderInputField}
                  />
                  <Field
                    name="phoneNumber"
                    label={Settings.fields.person.phoneNumber}
                    component={FieldHelper.renderInputField}
                  />
                  <Field
                    name="rank"
                    label={Settings.fields.person.rank}
                    component={FieldHelper.renderSpecialField}
                    widget={
                      <Field component="select" className="form-control">
                        <option />
                        {ranks.map(rank => (
                          <option key={rank.value} value={rank.value}>
                            {rank.value}{" "}
                            {rank.description && ` - ( ${rank.description} )`}
                          </option>
                        ))}
                      </Field>
                    }
                  />
                  <Field
                    name="gender"
                    label={Settings.fields.person.gender}
                    component={FieldHelper.renderSpecialField}
                    widget={
                      <Field component="select" className="form-control">
                        <option />
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </Field>
                    }
                  />
                  <Field
                    name="country"
                    label={Settings.fields.person.country}
                    component={FieldHelper.renderSpecialField}
                    widget={
                      <Field component="select" className="form-control">
                        <option />
                        {countries.map(country => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </Field>
                    }
                  />
                  <Field
                    name="endOfTourDate"
                    label={Settings.fields.person.endOfTourDate}
                    component={FieldHelper.renderSpecialField}
                    value={values.endOfTourDate}
                    onChange={value => setFieldValue("endOfTourDate", value)}
                    onBlur={() => setFieldTouched("endOfTourDate", true)}
                    widget={<CustomDateInput id="endOfTourDate" />}
                  >
                    {isAdvisor && endOfTourDateInPast && (
                      <Alert bsStyle="warning">
                        Be aware that the end of tour date is in the past.
                      </Alert>
                    )}
                  </Field>
                  <Field
                    name="biography"
                    component={FieldHelper.renderSpecialField}
                    onChange={value => setFieldValue("biography", value)}
                    widget={<RichTextEditor className="biography" />}
                  />
                </Fieldset>
                <div className="submit-buttons">
                  <div>
                    <Button onClick={this.onCancel}>Cancel</Button>
                  </div>
                  <div>
                    <Button
                      id="formBottomSubmit"
                      bsStyle="primary"
                      type="button"
                      onClick={submitForm}
                      disabled={isSubmitting}
                    >
                      {this.props.saveText}
                    </Button>
                  </div>
                </div>
              </Form>
            </React.Fragment>
          )
        }}
      </Formik>
    )
  }

  handleLastNameOnKeyDown = event => {
    // adding a "," to the last name results in jumping to the end of the first name
    if (event.key === ",") {
      event.preventDefault()
      document.getElementById("firstName").focus()
    }
  }

  onCancel = () => {
    this.props.history.goBack()
  }

  onSubmit = (values, form) => {
    this.save(values, form)
      .then(response => this.onSubmitSuccess(response, values, form))
      .catch(error => {
        this.setState({ error }, () => {
          form.setSubmitting(false)
          jumpToTop()
        })
      })
  }

  onSubmitSuccess = (response, values, form) => {
    if (this.state.onSaveRedirectToHome) {
      // After successful submit, reset the form in order to make sure the dirty
      // prop is also reset (otherwise we would get a blocking navigation warning)
      form.resetForm()
      localStorage.clear()
      localStorage.newUser = "true"
      this.props.loadAppData()
      this.props.history.push({
        pathname: "/"
      })
    } else {
      // After successful submit, reset the form in order to make sure the dirty
      // prop is also reset (otherwise we would get a blocking navigation warning)
      form.resetForm()
      const { edit } = this.props
      const operation = edit ? "updatePerson" : "createPerson"
      const person = new Person({
        uuid: response[operation].uuid
          ? response[operation].uuid
          : this.props.initialValues.uuid
      })
      this.props.history.replace(Person.pathForEdit(person))
      this.props.history.push({
        pathname: Person.pathFor(person),
        state: {
          success: "Person saved"
        }
      })
    }
  }

  save = (values, form) => {
    const { edit } = this.props
    let person = new Person(values)
    if (values.status === Person.STATUS.NEW_USER) {
      person.status = Person.STATUS.ACTIVE
    }
    person.name = Person.fullName(
      { firstName: person.firstName, lastName: person.lastName },
      true
    )
    // Clean up person object for JSON response
    person = Object.without(person, "firstName", "lastName")
    const operation = edit ? "updatePerson" : "createPerson"
    let graphql = /* GraphQL */ operation + "(person: $person)"
    graphql += edit ? "" : " { uuid }"
    const variables = { person: person }
    const variableDef = "($person: PersonInput!)"
    return API.mutation(graphql, variables, variableDef)
  }

  showWrongPersonModal = () => {
    this.setState({ showWrongPersonModal: true })
  }

  confirmReset = (values, form) => {
    values.status = Person.STATUS.INACTIVE
    this.save(values, form)
      .then(response =>
        this.onSubmitSuccess(
          response,
          values,
          form,
          this.state.wrongPersonOptionValue === "needNewAccount"
        )
      )
      .catch(error => {
        this.setState({ error })
        jumpToTop()
      })
  }

  hideWrongPersonModal = optionValue => {
    this.setState({
      showWrongPersonModal: false,
      wrongPersonOptionValue: optionValue
    })
    if (optionValue) {
      // do something useful with optionValue
      switch (optionValue) {
        case "needNewAccount":
        case "leftVacant":
        case "hasReplacement":
          // reset account?
          this.confirmHasReplacementButton.buttonRef.props.onClick()
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

const PersonForm = props => (
  <AppContext.Consumer>
    {context => (
      <BasePersonForm
        currentUser={context.currentUser}
        loadAppData={context.loadAppData}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

export default withRouter(PersonForm)
