import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  AuthorizationGroupOverlayRow,
  LocationOverlayRow,
  PersonDetailedOverlayRow,
  TaskDetailedOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import ConfirmDelete from "components/ConfirmDelete"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import {
  jumpToTop,
  routerRelatedPropTypes,
  useBoilerplate
} from "components/Page"
import ReportTags from "components/ReportTags"
import RichTextEditor from "components/RichTextEditor"
import TaskTable from "components/TaskTable"
import { Field, Form, Formik } from "formik"
import _cloneDeep from "lodash/cloneDeep"
import _upperFirst from "lodash/upperFirst"
import { AuthorizationGroup, Location, Person, Report, Task } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Button, Checkbox, Collapse, HelpBlock } from "react-bootstrap"
import { withRouter } from "react-router-dom"
import { toast } from "react-toastify"
import LOCATIONS_ICON from "resources/locations.png"
import PEOPLE_ICON from "resources/people.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"
import AttendeesTable from "./AttendeesTable"
import AuthorizationGroupTable from "./AuthorizationGroupTable"

const GQL_GET_RECENTS = gql`
  query {
    locationRecents(maxResults: 6) {
      list {
        uuid
        name
      }
    }
    personRecents(maxResults: 6) {
      list {
        uuid
        name
        rank
        role
        status
        endOfTourDate
        avatar(size: 32)
        position {
          uuid
          name
          type
          status
          organization {
            uuid
            shortName
          }
          location {
            uuid
            name
          }
        }
      }
    }
    taskRecents(maxResults: 6) {
      list {
        uuid
        shortName
        longName
        responsibleOrg {
          uuid
          shortName
        }
      }
    }
    authorizationGroupRecents(maxResults: 6) {
      list {
        uuid
        name
        description
      }
    }
    tagList(
      query: {
        pageSize: 0 # retrieve all
      }
    ) {
      list {
        uuid
        name
        description
      }
    }
  }
`
const GQL_CREATE_REPORT = gql`
  mutation($report: ReportInput!) {
    createReport(report: $report) {
      uuid
      state
      author {
        uuid
      }
      reportSensitiveInformation {
        uuid
        text
      }
    }
  }
`
const GQL_UPDATE_REPORT = gql`
  mutation($report: ReportInput!, $sendEditEmail: Boolean!) {
    updateReport(report: $report, sendEditEmail: $sendEditEmail) {
      uuid
      state
      author {
        uuid
      }
      reportSensitiveInformation {
        uuid
        text
      }
    }
  }
`
const GQL_DELETE_REPORT = gql`
  mutation($uuid: String!) {
    deleteReport(uuid: $uuid)
  }
`

const BaseReportForm = props => {
  const { currentUser, edit, title, initialValues, ...myFormProps } = props
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(
    props.showSensitiveInfo
  )
  const [saveError, setSaveError] = useState(null)
  const [autoSavedAt, setAutoSavedAt] = useState(null)
  // some autosave settings
  const defaultTimeout = moment.duration(30, "seconds")
  const autoSaveSettings = {
    autoSaveTimeout: defaultTimeout.clone(),
    timeoutId: null,
    dirty: false,
    values: {}
  }
  useEffect(() => {
    return () => {
      window.clearTimeout(autoSaveSettings.timeoutId)
    }
  })
  const { loading, error, data } = API.useApiQuery(GQL_GET_RECENTS)
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }
  const submitText = currentUser.hasActivePosition()
    ? "Preview and submit"
    : "Save draft"
  const showAssignedPositionWarning = !currentUser.hasAssignedPosition()
  const showActivePositionWarning =
    currentUser.hasAssignedPosition() && !currentUser.hasActivePosition()
  const alertStyle = { top: 132, marginBottom: "1rem", textAlign: "center" }
  const supportEmail = Settings.SUPPORT_EMAIL_ADDR
  const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ""
  const advisorPositionSingular = Settings.fields.advisor.position.name
  const atmosphereButtons = [
    {
      id: "positiveAtmos",
      value: Report.ATMOSPHERE.POSITIVE,
      label: "Positive"
    },
    {
      id: "neutralAtmos",
      value: Report.ATMOSPHERE.NEUTRAL,
      label: "Neutral"
    },
    {
      id: "negativeAtmos",
      value: Report.ATMOSPHERE.NEGATIVE,
      label: "Negative"
    }
  ]
  const cancelledReasonOptions = [
    {
      value: "CANCELLED_BY_ADVISOR",
      label: `Cancelled by ${Settings.fields.advisor.person.name}`
    },
    {
      value: "CANCELLED_BY_PRINCIPAL",
      label: `Cancelled by ${Settings.fields.principal.person.name}`
    },
    {
      value: "CANCELLED_DUE_TO_TRANSPORTATION",
      label: "Cancelled due to Transportation"
    },
    {
      value: "CANCELLED_DUE_TO_FORCE_PROTECTION",
      label: "Cancelled due to Force Protection"
    },
    {
      value: "CANCELLED_DUE_TO_ROUTES",
      label: "Cancelled due to Routes"
    },
    {
      value: "CANCELLED_DUE_TO_THREAT",
      label: "Cancelled due to Threat"
    },
    {
      value: "CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS",
      label: "Cancelled due to Availability of Interpreter(s)"
    }
  ]

  let recents = []
  let tagSuggestions = []
  if (data) {
    recents = {
      locations: data.locationRecents.list,
      persons: data.personRecents.list,
      tasks: data.taskRecents.list,
      authorizationGroups: data.authorizationGroupRecents.list
    }
    // ReactTags expects id and text properties
    tagSuggestions = data.tagList.list.map(tag => ({
      id: tag.uuid,
      text: tag.name
    }))
  }

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Report.yupSchema}
      isInitialValid
      initialValues={initialValues}
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
        touched,
        submitForm,
        resetForm,
        setSubmitting
      }) => {
        const currentOrgUuid =
          currentUser.position && currentUser.position.organization
            ? currentUser.position.organization.uuid
            : undefined
        const locationFilters = {
          activeLocations: {
            label: "Active locations",
            queryVars: { status: Location.STATUS.ACTIVE }
          }
        }

        const attendeesFilters = {
          all: {
            label: "All",
            queryVars: { matchPositionName: true }
          },
          activeAdvisors: {
            label: "All advisors",
            queryVars: { role: Person.ROLE.ADVISOR, matchPositionName: true }
          },
          activePrincipals: {
            label: "All principals",
            queryVars: { role: Person.ROLE.PRINCIPAL }
          }
        }
        if (currentOrgUuid) {
          attendeesFilters.myColleagues = {
            label: "My colleagues",
            queryVars: {
              role: Person.ROLE.ADVISOR,
              matchPositionName: true,
              orgUuid: currentOrgUuid
            }
          }
          attendeesFilters.myCounterparts = {
            label: "My counterparts",
            list: currentUser.position.associatedPositions
              .filter(ap => ap.person)
              .map(ap => ap.person)
          }
        }
        if (values.location && values.location.uuid) {
          attendeesFilters.atLocation = {
            label: `At ${values.location.name}`,
            queryVars: {
              locationUuid:
                values.location && values.location.uuid
                  ? values.location.uuid
                  : null
            }
          }
        }

        const tasksFilters = {
          allTasks: {
            label: "All tasks",
            queryVars: {}
          }
        }
        if (currentOrgUuid) {
          tasksFilters.assignedToMyOrg = {
            label: "Assigned to my organization",
            queryVars: {
              responsibleOrgUuid: currentOrgUuid
            }
          }
        }
        const primaryAdvisors = values.attendees.filter(
          a => a.role === Person.ROLE.ADVISOR && a.primary === true
        )
        const primaryAdvisor = primaryAdvisors.length
          ? primaryAdvisors[0]
          : null
        if (
          primaryAdvisor &&
          primaryAdvisor.position &&
          primaryAdvisor.position.organization
        ) {
          tasksFilters.assignedToReportOrg = {
            label: "Assigned to organization of report",
            queryVars: {
              responsibleOrgUuid: primaryAdvisor.position.organization.uuid
            }
          }
        }

        const authorizationGroupsFilters = {
          allAuthorizationGroups: {
            label: "All authorization groups",
            queryVars: {}
          }
        }
        // need up-to-date copies of these in the autosave handler
        autoSaveSettings.dirty = dirty
        autoSaveSettings.values = values
        autoSaveSettings.touched = touched
        if (!autoSaveSettings.timeoutId) {
          // Schedule the auto-save timer
          const autosaveHandler = () =>
            autoSave({ setFieldValue, setFieldTouched, resetForm })
          autoSaveSettings.timeoutId = window.setTimeout(
            autosaveHandler,
            autoSaveSettings.autoSaveTimeout.asMilliseconds()
          )
        }
        // Only the author can delete a report, and only in DRAFT.
        const canDelete =
          !!values.uuid &&
          (Report.isDraft(values.state) || Report.isRejected(values.state)) &&
          Person.isEqual(currentUser, values.author)
        // Skip validation on save!
        const action = (
          <div>
            <Button
              bsStyle="primary"
              type="button"
              onClick={() => onSubmit(values, { resetForm, setSubmitting })}
              disabled={isSubmitting}
            >
              {submitText}
            </Button>
          </div>
        )
        const isFutureEngagement = Report.isFuture(values.engagementDate)
        return (
          <div className="report-form">
            <NavigationWarning isBlocking={dirty} />
            <Messages error={saveError} />

            {showAssignedPositionWarning && (
              <div className="alert alert-warning" style={alertStyle}>
                You cannot submit a report: you are not assigned to a{" "}
                {advisorPositionSingular} position.
                <br />
                Please contact your organization's super user(s) and request to
                be assigned to a {advisorPositionSingular} position.
                <br />
                If you are unsure, you can also contact the support team{" "}
                {supportEmailMessage}.
              </div>
            )}

            {showActivePositionWarning && (
              <div className="alert alert-warning" style={alertStyle}>
                You cannot submit a report: your assigned{" "}
                {advisorPositionSingular} position has an inactive status.
                <br />
                Please contact your organization's super users and request them
                to assign you to an active {advisorPositionSingular} position.
                <br />
                If you are unsure, you can also contact the support team{" "}
                {supportEmailMessage}.
              </div>
            )}

            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <Field
                  name="intent"
                  label={Settings.fields.report.intent}
                  component={FieldHelper.renderInputField}
                  componentClass="textarea"
                  placeholder="What is the engagement supposed to achieve?"
                  maxLength={Settings.maxTextFieldLength}
                  onKeyUp={event =>
                    countCharsLeft(
                      "intentCharsLeft",
                      Settings.maxTextFieldLength,
                      event
                    )
                  }
                  extraColElem={
                    <React.Fragment>
                      <span id="intentCharsLeft">
                        {Settings.maxTextFieldLength -
                          initialValues.intent.length}
                      </span>{" "}
                      characters remaining
                    </React.Fragment>
                  }
                  className="meeting-goal"
                />

                <Field
                  name="engagementDate"
                  component={FieldHelper.renderSpecialField}
                  onChange={value => setFieldValue("engagementDate", value)}
                  onBlur={() => setFieldTouched("engagementDate", true)}
                  widget={
                    <CustomDateInput
                      id="engagementDate"
                      withTime={Settings.engagementsIncludeTimeAndDuration}
                    />
                  }
                >
                  {isFutureEngagement && (
                    <HelpBlock>
                      <span className="text-success">
                        This will create an planned engagement
                      </span>
                    </HelpBlock>
                  )}
                </Field>

                {Settings.engagementsIncludeTimeAndDuration && (
                  <Field
                    name="duration"
                    label="Duration (minutes)"
                    component={FieldHelper.renderInputField}
                  />
                )}

                <AdvancedSingleSelect
                  fieldName="location"
                  fieldLabel="Location"
                  placeholder="Search for the engagement location..."
                  value={values.location}
                  overlayColumns={["Name"]}
                  overlayRenderRow={LocationOverlayRow}
                  filterDefs={locationFilters}
                  onChange={value => setFieldValue("location", value)}
                  objectType={Location}
                  fields={Location.autocompleteQuery}
                  valueKey="name"
                  addon={LOCATIONS_ICON}
                  shortcutsTitle="Recent Locations"
                  shortcuts={recents.locations}
                  renderExtraCol
                />

                {!isFutureEngagement && (
                  <Field
                    name="cancelled"
                    component={FieldHelper.renderSpecialField}
                    label={Settings.fields.report.cancelled}
                    widget={
                      <Checkbox
                        inline
                        className="cancelled-checkbox"
                        checked={values.cancelled}
                        onClick={event =>
                          event.target.checked &&
                          !values.cancelledReason &&
                          // set a default reason when cancelled has been checked and no reason has been selected
                          setFieldValue(
                            "cancelledReason",
                            cancelledReasonOptions[0].value
                          )
                        }
                      >
                        This engagement was cancelled
                      </Checkbox>
                    }
                  />
                )}
                {!isFutureEngagement && values.cancelled && (
                  <Field
                    name="cancelledReason"
                    label="due to"
                    component={FieldHelper.renderSpecialField}
                    widget={
                      <Field
                        component="select"
                        className="cancelled-reason-form-group form-control"
                      >
                        {cancelledReasonOptions.map(reason => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </Field>
                    }
                  />
                )}

                {!isFutureEngagement && !values.cancelled && (
                  <Field
                    name="atmosphere"
                    label={Settings.fields.report.atmosphere}
                    component={FieldHelper.renderButtonToggleGroup}
                    buttons={atmosphereButtons}
                    onChange={value => setFieldValue("atmosphere", value)}
                    className="atmosphere-form-group"
                  />
                )}
                {!isFutureEngagement &&
                  !values.cancelled &&
                  values.atmosphere && (
                  <Field
                    name="atmosphereDetails"
                    label={Settings.fields.report.atmosphereDetails}
                    component={FieldHelper.renderInputField}
                    placeholder={`Why was this engagement ${values.atmosphere.toLowerCase()}? ${
                      values.atmosphere === "POSITIVE" ? "(optional)" : ""
                    }`}
                    className="atmosphere-details"
                  />
                )}

                {Settings.fields.report.reportTags && (
                  <Field
                    name="reportTags"
                    label={Settings.fields.report.reportTags}
                    component={FieldHelper.renderSpecialField}
                    onChange={value => setFieldValue("reportTags", value)}
                    widget={<ReportTags suggestions={tagSuggestions} />}
                  />
                )}
              </Fieldset>

              <Fieldset
                title={
                  !values.cancelled && !isFutureEngagement
                    ? "Meeting attendance"
                    : "Planned attendance"
                }
                id="attendance-fieldset"
              >
                <AdvancedMultiSelect
                  fieldName="attendees"
                  fieldLabel="Attendees"
                  placeholder="Search for the meeting attendees..."
                  value={values.attendees}
                  renderSelected={
                    <AttendeesTable
                      attendees={values.attendees}
                      onChange={value => setFieldValue("attendees", value)}
                      showDelete
                    />
                  }
                  overlayColumns={[
                    "Name",
                    "Position",
                    "Location",
                    "Organization"
                  ]}
                  overlayRenderRow={PersonDetailedOverlayRow}
                  filterDefs={attendeesFilters}
                  onChange={value =>
                    updateAttendees(setFieldValue, "attendees", value)
                  }
                  objectType={Person}
                  queryParams={{
                    status: [Person.STATUS.ACTIVE]
                  }}
                  fields={Person.autocompleteQuery}
                  addon={PEOPLE_ICON}
                  shortcutsTitle="Recent Attendees"
                  shortcuts={recents.persons}
                  renderExtraCol
                />
              </Fieldset>

              <Fieldset
                title={Settings.fields.task.longLabel}
                className="tasks-selector"
              >
                <AdvancedMultiSelect
                  fieldName="tasks"
                  fieldLabel={Settings.fields.task.shortLabel}
                  placeholder={`Search for ${pluralize(
                    Settings.fields.task.shortLabel
                  )}...`}
                  value={values.tasks}
                  renderSelected={
                    <TaskTable
                      tasks={values.tasks}
                      showDelete
                      showOrganization
                    />
                  }
                  overlayColumns={["Name", "Organization"]}
                  overlayRenderRow={TaskDetailedOverlayRow}
                  filterDefs={tasksFilters}
                  onChange={value => {
                    setFieldValue("tasks", value)
                    setFieldTouched("tasks", true)
                  }}
                  objectType={Task}
                  queryParams={{ status: Task.STATUS.ACTIVE }}
                  fields={Task.autocompleteQuery}
                  addon={TASKS_ICON}
                  shortcutsTitle={`Recent ${pluralize(
                    Settings.fields.task.shortLabel
                  )}`}
                  shortcuts={recents.tasks}
                  renderExtraCol
                />
              </Fieldset>

              <Fieldset
                title={
                  !values.cancelled
                    ? "Meeting discussion"
                    : "Next steps and details"
                }
                id="meeting-details"
              >
                {!isFutureEngagement && !values.cancelled && (
                  <Field
                    name="keyOutcomes"
                    label={Settings.fields.report.keyOutcomes}
                    component={FieldHelper.renderInputField}
                    componentClass="textarea"
                    maxLength={Settings.maxTextFieldLength}
                    onKeyUp={event =>
                      countCharsLeft(
                        "keyOutcomesCharsLeft",
                        Settings.maxTextFieldLength,
                        event
                      )
                    }
                    extraColElem={
                      <React.Fragment>
                        <span id="keyOutcomesCharsLeft">
                          {Settings.maxTextFieldLength -
                            initialValues.keyOutcomes.length}
                        </span>{" "}
                        characters remaining
                      </React.Fragment>
                    }
                  />
                )}

                {!isFutureEngagement && (
                  <Field
                    name="nextSteps"
                    label={Settings.fields.report.nextSteps}
                    component={FieldHelper.renderInputField}
                    componentClass="textarea"
                    maxLength={Settings.maxTextFieldLength}
                    onKeyUp={event =>
                      countCharsLeft(
                        "nextStepsCharsLeft",
                        Settings.maxTextFieldLength,
                        event
                      )
                    }
                    extraColElem={
                      <React.Fragment>
                        <span id="nextStepsCharsLeft">
                          {Settings.maxTextFieldLength -
                            initialValues.nextSteps.length}
                        </span>{" "}
                        characters remaining
                      </React.Fragment>
                    }
                  />
                )}

                <Field
                  name="reportText"
                  label={Settings.fields.report.reportText}
                  component={FieldHelper.renderSpecialField}
                  onChange={value => setFieldValue("reportText", value)}
                  widget={
                    <RichTextEditor
                      className="reportTextField"
                      onHandleBlur={() => setFieldTouched("reportText", true)}
                    />
                  }
                />

                <Button
                  className="center-block toggle-section-button"
                  style={{ marginBottom: "1rem" }}
                  onClick={toggleReportText}
                  id="toggleSensitiveInfo"
                >
                  {showSensitiveInfo ? "Hide" : "Add"} sensitive information
                </Button>

                <Collapse in={showSensitiveInfo}>
                  {(values.reportSensitiveInformation || !props.edit) && (
                    <div>
                      <Field
                        name="reportSensitiveInformation.text"
                        component={FieldHelper.renderSpecialField}
                        label="Report sensitive information text"
                        onChange={value =>
                          setFieldValue(
                            "reportSensitiveInformation.text",
                            value
                          )
                        }
                        widget={
                          <RichTextEditor
                            className="reportSensitiveInformationField"
                            onHandleBlur={() =>
                              setFieldTouched(
                                "reportSensitiveInformation.text",
                                true
                              )
                            }
                          />
                        }
                      />
                      <AdvancedMultiSelect
                        fieldName="authorizationGroups"
                        fieldLabel="Authorization Groups"
                        placeholder="Search for authorization groups..."
                        value={values.authorizationGroups}
                        renderSelected={
                          <AuthorizationGroupTable
                            authorizationGroups={values.authorizationGroups}
                            showDelete
                          />
                        }
                        overlayColumns={["Name", "Description"]}
                        overlayRenderRow={AuthorizationGroupOverlayRow}
                        filterDefs={authorizationGroupsFilters}
                        onChange={value =>
                          setFieldValue("authorizationGroups", value)
                        }
                        objectType={AuthorizationGroup}
                        queryParams={{
                          status: AuthorizationGroup.STATUS.ACTIVE
                        }}
                        fields={AuthorizationGroup.autocompleteQuery}
                        shortcutsTitle="Recent Authorization Groups"
                        shortcuts={recents.authorizationGroups}
                        renderExtraCol
                      />
                    </div>
                  )}
                </Collapse>
              </Fieldset>

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel}>Cancel</Button>
                </div>
                <div>
                  {autoSavedAt && (
                    <div>
                      Last autosaved at{" "}
                      {autoSavedAt.format(
                        Settings.dateFormats.forms.displayShort.withTime
                      )}
                    </div>
                  )}
                  {canDelete && (
                    <ConfirmDelete
                      onConfirmDelete={() =>
                        onConfirmDelete(values.uuid, resetForm)
                      }
                      objectType="report"
                      objectDisplay={values.uuid}
                      bsStyle="warning"
                      buttonLabel={`Delete this ${getReportType(values)}`}
                    />
                  )}
                  {/* Skip validation on save! */}
                  <Button
                    id="formBottomSubmit"
                    bsStyle="primary"
                    type="button"
                    onClick={() => onSubmit(values, { resetForm: resetForm })}
                    disabled={isSubmitting}
                  >
                    {submitText}
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function getReportType(values) {
    return values.engagementDate && Report.isFuture(values.engagementDate)
      ? "planned engagement"
      : "report"
  }

  function getReportTypeUpperFirst(values) {
    return _upperFirst(getReportType(values))
  }

  function updateAttendees(setFieldValue, field, attendees) {
    attendees.forEach(attendee => {
      if (!attendees.find(a2 => attendee.role === a2.role && a2.primary)) {
        attendee.primary = true
      } else {
        // Make sure field is 'controlled' by defining a value
        attendee.primary = attendee.primary || false
      }
    })
    setFieldValue(field, attendees)
  }

  function countCharsLeft(elemId, maxChars, event) {
    // update the number of characters left
    const charsLeftElem = document.getElementById(elemId)
    charsLeftElem.innerHTML = maxChars - event.target.value.length
  }

  function isEditMode(values) {
    // We're in edit mode when the form was started as an edit form, or when the report got an id after autosave
    return !!values.uuid
  }

  function toggleReportText() {
    setShowSensitiveInfo(!showSensitiveInfo)
  }

  function autoSave(form) {
    const autosaveHandler = () => autoSave(form)
    // Only auto-save if the report has changed
    if (!autoSaveSettings.dirty) {
      // Just re-schedule the auto-save timer
      autoSaveSettings.timeoutId = window.setTimeout(
        autosaveHandler,
        autoSaveSettings.autoSaveTimeout.asMilliseconds()
      )
    } else {
      const edit = isEditMode(autoSaveSettings.values)
      const operation = edit ? "updateReport" : "createReport"
      save(autoSaveSettings.values, false)
        .then(response => {
          const newValues = _cloneDeep(autoSaveSettings.values)
          Object.assign(newValues, response[operation])
          if (newValues.reportSensitiveInformation === null) {
            newValues.reportSensitiveInformation = {} // object must exist for Collapse children
          }
          // After successful autosave, reset the form with the new values in order to make sure the dirty
          // prop is also reset (otherwise we would get a blocking navigation warning)
          const touched = _cloneDeep(autoSaveSettings.touched) // save previous touched
          form.resetForm(newValues)
          Object.entries(touched).forEach(([field, value]) =>
            // re-set touched so we keep messages
            form.setFieldTouched(field, value)
          )
          autoSaveSettings.autoSaveTimeout = defaultTimeout.clone() // reset to default
          setAutoSavedAt(moment())
          toast.success(
            `Your ${getReportType(newValues)} has been automatically saved`
          )
          // And re-schedule the auto-save timer
          autoSaveSettings.timeoutId = window.setTimeout(
            autosaveHandler,
            autoSaveSettings.autoSaveTimeout.asMilliseconds()
          )
        })
        /* eslint-disable handle-callback-err */

        .catch(error => {
          // Show an error message
          autoSaveSettings.autoSaveTimeout.add(autoSaveSettings.autoSaveTimeout) // exponential back-off
          toast.error(
            `There was an error autosaving your ${getReportType(
              autoSaveSettings.values
            )}; we'll try again in ${autoSaveSettings.autoSaveTimeout.humanize()}`
          )
          // And re-schedule the auto-save timer
          autoSaveSettings.timeoutId = window.setTimeout(
            autosaveHandler,
            autoSaveSettings.autoSaveTimeout.asMilliseconds()
          )
        })
      /* eslint-enable handle-callback-err */
    }
  }

  function onConfirmDelete(uuid, resetForm) {
    API.mutation(GQL_DELETE_REPORT, { uuid })
      .then(data => {
        // After successful delete, reset the form in order to make sure the dirty
        // prop is also reset (otherwise we would get a blocking navigation warning)
        resetForm()
        props.history.push("/", { success: "Report deleted" })
      })
      .catch(error => {
        setSaveError(error)
        jumpToTop()
      })
  }

  function onCancel() {
    props.history.goBack()
  }

  function onSubmit(values, form) {
    return save(values, true)
      .then(response => onSubmitSuccess(response, values, form.resetForm))
      .catch(error => {
        setSaveError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, resetForm) {
    const edit = isEditMode(values)
    const operation = edit ? "updateReport" : "createReport"
    const report = new Report({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    resetForm()
    if (!edit) {
      props.history.replace(Report.pathForEdit(report))
    }
    props.history.push(Report.pathFor(report), {
      success: `${getReportTypeUpperFirst(values)} saved`
    })
  }

  function save(values, sendEmail) {
    const report = Object.without(
      new Report(values),
      "notes",
      "cancelled",
      "reportTags",
      "showSensitiveInfo",
      "attendees"
    )
    if (Report.isFuture(values.engagementDate)) {
      // Empty fields which should not be set for future reports.
      // They might have been set before the report has been marked as future.
      report.atmosphere = null
      report.atmosphereDetails = ""
      report.nextSteps = ""
      report.keyOutcomes = ""
      delete report.cancelledReason
    }
    if (!values.cancelled) {
      delete report.cancelledReason
    } else {
      // Empty fields which should not be set for cancelled reports.
      // They might have been set before the report has been marked as cancelled.
      report.atmosphere = null
      report.atmosphereDetails = ""
      report.keyOutcomes = ""
    }
    // reportTags contains id's instead of uuid's (as that is what the ReactTags component expects)
    report.tags = values.reportTags.map(tag => ({ uuid: tag.id }))
    // strip attendees fields not in data model
    report.attendees = values.attendees.map(a =>
      Object.without(a, "firstName", "lastName", "position")
    )
    report.location = utils.getReference(report.location)
    const edit = isEditMode(values)
    const variables = { report }
    if (edit) {
      variables.sendEditEmail = sendEmail
    }
    return API.mutation(edit ? GQL_UPDATE_REPORT : GQL_CREATE_REPORT, variables)
  }
}

BaseReportForm.propTypes = {
  initialValues: PropTypes.instanceOf(Report).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  showSensitiveInfo: PropTypes.bool,
  currentUser: PropTypes.instanceOf(Person),
  ...routerRelatedPropTypes
}

BaseReportForm.defaultProps = {
  title: "",
  edit: false,
  showSensitiveInfo: false
}

const ReportForm = props => (
  <AppContext.Consumer>
    {context => <BaseReportForm currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default withRouter(ReportForm)
