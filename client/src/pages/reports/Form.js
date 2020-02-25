import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
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
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { createYupObjectShape, NOTE_TYPE } from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import ReportTags from "components/ReportTags"
import RichTextEditor from "components/RichTextEditor"
import { RECURSE_STRATEGY } from "components/SearchFilters"
import TaskTable from "components/TaskTable"
import { FastField, Field, Form, Formik } from "formik"
import _cloneDeep from "lodash/cloneDeep"
import _debounce from "lodash/debounce"
import _isEmpty from "lodash/isEmpty"
import _upperFirst from "lodash/upperFirst"
import { AuthorizationGroup, Location, Person, Report, Task } from "models"
import moment from "moment"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Button, Checkbox, Collapse, HelpBlock } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import { toast } from "react-toastify"
import LOCATIONS_ICON from "resources/locations.png"
import PEOPLE_ICON from "resources/people.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"
import * as yup from "yup"
import AttendeesTable from "./AttendeesTable"
import AuthorizationGroupTable from "./AuthorizationGroupTable"

const GQL_GET_RECENTS = gql`
  query($taskQuery: TaskSearchQueryInput) {
    locationList(
      query: {
        pageSize: 6
        status: ACTIVE
        inMyReports: true
        sortBy: RECENT
        sortOrder: DESC
      }
    ) {
      list {
        uuid
        name
      }
    }
    personList(
      query: {
        pageSize: 6
        status: ACTIVE
        inMyReports: true
        sortBy: RECENT
        sortOrder: DESC
      }
    ) {
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
    taskList(query: $taskQuery) {
      list {
        uuid
        shortName
        longName
        customFieldRef1 {
          uuid
          shortName
        }
        taskedOrganizations {
          uuid
          shortName
        }
        customFields
      }
    }
    authorizationGroupList(
      query: {
        pageSize: 6
        status: ACTIVE
        inMyReports: true
        sortBy: RECENT
        sortOrder: DESC
      }
    ) {
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
const GQL_UPDATE_REPORT_ASSESSMENTS = gql`
  mutation($report: ReportInput!, $notes: [NoteInput]) {
    updateReportAssessments(report: $report, assessments: $notes)
  }
`

const BaseReportForm = ({
  pageDispatchers,
  currentUser,
  edit,
  title,
  initialValues,
  showSensitiveInfo: ssi
}) => {
  const history = useHistory()
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(ssi)
  const [saveError, setSaveError] = useState(null)
  const [autoSavedAt, setAutoSavedAt] = useState(null)
  // We need the report tasks in order to be able to dynamically update the yup schema for the selected task assessments
  const [reportTasks, setReportTasks] = useState(initialValues.tasks)
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

  const recentTasksVarCommon = {
    pageSize: 6,
    status: Task.STATUS.ACTIVE,
    hasCustomFieldRef1: true,
    sortBy: "RECENT",
    sortOrder: "DESC"
  }

  let recentTasksVarUser
  if (currentUser.isAdmin()) {
    recentTasksVarUser = recentTasksVarCommon
  } else if (currentUser.position?.organization) {
    recentTasksVarUser = {
      ...recentTasksVarCommon,
      inMyReports: true,
      taskedOrgUuid: currentUser.position?.organization?.uuid,
      orgRecurseStrategy: RECURSE_STRATEGY.PARENTS
    }
  } else {
    recentTasksVarUser = {
      pageSize: 1,
      status: Task.STATUS.ACTIVE,
      text: "__should_not_match_anything__" // TODO: Do this more gracefully
    }
  }

  const { loading, error, data } = API.useApiQuery(GQL_GET_RECENTS, {
    taskQuery: recentTasksVarUser
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
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
      locations: data.locationList.list,
      persons: data.personList.list,
      tasks: data.taskList.list,
      authorizationGroups: data.authorizationGroupList.list
    }
    // ReactTags expects id and text properties
    tagSuggestions = data.tagList.list.map(tag => ({
      id: tag.uuid,
      text: tag.name
    }))
  }

  // Update the task assessments schema according to the selected report tasks
  const taskAssessmentsSchemaShape = {}
  reportTasks
    .filter(t => t.customFields)
    .forEach(t => {
      taskAssessmentsSchemaShape[t.uuid] = createYupObjectShape(
        JSON.parse(JSON.parse(t.customFields).assessmentDefinition),
        `taskAssessments.${t.uuid}`
      )
    })
  const reportSchema = _isEmpty(taskAssessmentsSchemaShape)
    ? Report.yupSchema
    : Report.yupSchema.concat(
      yup.object().shape({
        taskAssessments: yup
          .object()
          .shape(taskAssessmentsSchemaShape)
          .nullable()
          .default(null)
      })
    )
  let validateFieldDebounced

  return (
    <Formik
      enableReinitialize
      validateOnChange={false}
      validationSchema={reportSchema}
      initialValues={initialValues}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        validateField,
        validateForm,
        touched,
        resetForm,
        setSubmitting
      }) => {
        if (!validateFieldDebounced) {
          validateFieldDebounced = _debounce(validateField, 400)
        }
        const currentOrg =
          currentUser.position && currentUser.position.organization
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
        if (currentOrg) {
          attendeesFilters.myColleagues = {
            label: "My colleagues",
            queryVars: {
              role: Person.ROLE.ADVISOR,
              matchPositionName: true,
              orgUuid: currentOrg.uuid
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

        const tasksFiltersLevel = {}

        if (currentOrg) {
          tasksFiltersLevel.assignedToMyOrg = {
            label: `Assigned to ${currentOrg.shortName}`,
            queryVars: {
              taskedOrgUuid: currentOrg.uuid,
              hasCustomFieldRef1: true,
              orgRecurseStrategy: RECURSE_STRATEGY.PARENTS
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
          primaryAdvisor?.position?.organization &&
          primaryAdvisor.position.organization.uuid !== currentOrg?.uuid
        ) {
          tasksFiltersLevel.assignedToReportOrg = {
            label: `Assigned to ${primaryAdvisor.position.organization}`,
            queryVars: {
              taskedOrgUuid: primaryAdvisor.position.organization.uuid,
              hasCustomFieldRef1: true,
              orgRecurseStrategy: RECURSE_STRATEGY.PARENTS
            }
          }
        }

        if (currentUser.isAdmin()) {
          tasksFiltersLevel.allTasks = {
            label: "All efforts", // TODO: Implement conditional labels, until then, we need to be explicit here
            queryVars: { hasCustomFieldRef1: true }
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
                <FastField
                  name="intent"
                  label={Settings.fields.report.intent}
                  component={FieldHelper.InputField}
                  componentClass="textarea"
                  placeholder="What is the engagement supposed to achieve?"
                  maxLength={Settings.maxTextFieldLength}
                  onChange={event => {
                    setFieldTouched("intent", true, false)
                    setFieldValue("intent", event.target.value, false)
                    validateFieldDebounced("intent")
                  }}
                  onKeyUp={event =>
                    countCharsLeft(
                      "intentCharsLeft",
                      Settings.maxTextFieldLength,
                      event
                    )}
                  extraColElem={
                    <>
                      <span id="intentCharsLeft">
                        {Settings.maxTextFieldLength -
                          initialValues.intent.length}
                      </span>{" "}
                      characters remaining
                    </>
                  }
                  className="meeting-goal"
                />

                <FastField
                  name="engagementDate"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    setFieldTouched("engagementDate", true, false) // onBlur doesn't work when selecting a date
                    setFieldValue("engagementDate", value, true)
                  }}
                  onBlur={() => setFieldTouched("engagementDate")}
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
                </FastField>

                {Settings.engagementsIncludeTimeAndDuration && (
                  <FastField
                    name="duration"
                    label="Duration (minutes)"
                    component={FieldHelper.InputField}
                    onChange={event => {
                      setFieldTouched("duration", true, false)
                      setFieldValue("duration", event.target.value, false)
                      validateFieldDebounced("duration")
                    }}
                  />
                )}

                <FastField
                  name="location"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("location", value, true)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="location"
                      placeholder="Search for the engagement location..."
                      value={values.location}
                      overlayColumns={["Name"]}
                      overlayRenderRow={LocationOverlayRow}
                      filterDefs={locationFilters}
                      objectType={Location}
                      fields={Location.autocompleteQuery}
                      valueKey="name"
                      addon={LOCATIONS_ICON}
                    />
                  }
                  extraColElem={
                    <>
                      <FieldHelper.FieldShortcuts
                        title="Recent Locations"
                        shortcuts={recents.locations}
                        fieldName="location"
                        objectType={Location}
                        curValue={values.location}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
                          setFieldValue("location", value, true)
                        }}
                        handleAddItem={FieldHelper.handleSingleSelectAddItem}
                      />
                    </>
                  }
                />

                {!isFutureEngagement && (
                  <FastField
                    name="cancelled"
                    component={FieldHelper.SpecialField}
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
                            cancelledReasonOptions[0].value,
                            true
                          )}
                      >
                        This engagement was cancelled
                      </Checkbox>
                    }
                  />
                )}
                {!isFutureEngagement && values.cancelled && (
                  <FastField
                    name="cancelledReason"
                    label="due to"
                    component={FieldHelper.SpecialField}
                    onChange={event => {
                      // validation will be done by setFieldValue
                      setFieldValue("cancelledReason", event.target.value, true)
                    }}
                    widget={
                      <FastField
                        component="select"
                        className="cancelled-reason-form-group form-control"
                      >
                        {cancelledReasonOptions.map(reason => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </FastField>
                    }
                  />
                )}

                {!isFutureEngagement && !values.cancelled && (
                  <FastField
                    name="atmosphere"
                    label={Settings.fields.report.atmosphere}
                    component={FieldHelper.RadioButtonToggleGroupField}
                    buttons={atmosphereButtons}
                    onChange={value => setFieldValue("atmosphere", value, true)}
                    className="atmosphere-form-group"
                  />
                )}
                {!isFutureEngagement && !values.cancelled && values.atmosphere && (
                  <Field
                    name="atmosphereDetails"
                    label={Settings.fields.report.atmosphereDetails}
                    component={FieldHelper.InputField}
                    onChange={event => {
                      setFieldTouched("atmosphereDetails", true, false)
                      setFieldValue(
                        "atmosphereDetails",
                        event.target.value,
                        false
                      )
                      validateFieldDebounced("atmosphereDetails")
                    }}
                    placeholder={`Why was this engagement ${values.atmosphere.toLowerCase()}? ${
                      values.atmosphere === "POSITIVE" ? "(optional)" : ""
                    }`}
                    className="atmosphere-details"
                  />
                )}

                {Settings.fields.report.reportTags && (
                  <FastField
                    name="reportTags"
                    label={Settings.fields.report.reportTags}
                    component={FieldHelper.SpecialField}
                    onChange={value => setFieldValue("reportTags", value, true)}
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
                <Field
                  name="attendees"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("attendees", true, false) // onBlur doesn't work when selecting an option
                    updateAttendees(setFieldValue, "attendees", value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="attendees"
                      placeholder="Search for the meeting attendees..."
                      value={values.attendees}
                      renderSelected={
                        <AttendeesTable
                          attendees={values.attendees}
                          onChange={value =>
                            setFieldValue("attendees", value, true)}
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
                      objectType={Person}
                      queryParams={{
                        status: [Person.STATUS.ACTIVE]
                      }}
                      fields={Person.autocompleteQuery}
                      addon={PEOPLE_ICON}
                    />
                  }
                  extraColElem={
                    <>
                      <FieldHelper.FieldShortcuts
                        title="Recent attendees"
                        shortcuts={recents.persons}
                        fieldName="attendees"
                        objectType={Person}
                        curValue={values.attendees}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("attendees", true, false) // onBlur doesn't work when selecting an option
                          updateAttendees(setFieldValue, "attendees", value)
                        }}
                        handleAddItem={FieldHelper.handleMultiSelectAddItem}
                      />
                    </>
                  }
                />
              </Fieldset>

              <Fieldset
                title="Efforts" // TODO: Implement conditional labels, until then, we need to be explicit here
                className="tasks-selector"
              >
                <Field
                  name="tasks"
                  label="Efforts" // TODO: Implement conditional labels, until then, we need to be explicit here
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("tasks", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("tasks", value, true)
                    setReportTasks(value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="tasks"
                      placeholder={`Search for ${pluralize(
                        Settings.fields.task.shortLabel
                      )}...`}
                      value={values.tasks}
                      renderSelected={
                        <TaskTable
                          id="tasks-tasks"
                          tasks={values.tasks}
                          showParent
                          showDelete
                          showDescription
                        />
                      }
                      overlayColumns={[
                        "Effort", // TODO: Implement conditional labels, until then, we need to be explicit here
                        "Objective"
                      ]}
                      overlayRenderRow={TaskDetailedOverlayRow}
                      filterDefs={tasksFiltersLevel}
                      objectType={Task}
                      queryParams={{ status: Task.STATUS.ACTIVE }}
                      fields={Task.autocompleteQuery}
                      addon={TASKS_ICON}
                    />
                  }
                  extraColElem={
                    <>
                      <FieldHelper.FieldShortcuts
                        title={`Recent ${pluralize(
                          Settings.fields.task.shortLabel
                        )}`}
                        shortcuts={recents.tasks}
                        fieldName="tasks"
                        objectType={Task}
                        curValue={values.tasks}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("tasks", true, false) // onBlur doesn't work when selecting an option
                          setFieldValue("tasks", value, true)
                        }}
                        handleAddItem={FieldHelper.handleMultiSelectAddItem}
                      />
                    </>
                  }
                />
              </Fieldset>

              {Settings.fields.report.customFields && (
                <Fieldset title="Engagement information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.report.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}

              <Fieldset
                title={
                  !values.cancelled
                    ? "Meeting discussion"
                    : "Next steps and details"
                }
                id="meeting-details"
              >
                {Settings.fields.report.keyOutcomes &&
                  !isFutureEngagement &&
                  !values.cancelled && (
                    <FastField
                      name="keyOutcomes"
                      label={Settings.fields.report.keyOutcomes}
                      component={FieldHelper.InputField}
                      onChange={event => {
                        setFieldTouched("keyOutcomes", true, false)
                        setFieldValue("keyOutcomes", event.target.value, false)
                        validateFieldDebounced("keyOutcomes")
                      }}
                      componentClass="textarea"
                      maxLength={Settings.maxTextFieldLength}
                      onKeyUp={event =>
                        countCharsLeft(
                          "keyOutcomesCharsLeft",
                          Settings.maxTextFieldLength,
                          event
                        )}
                      extraColElem={
                        <>
                          <span id="keyOutcomesCharsLeft">
                            {Settings.maxTextFieldLength -
                              initialValues.keyOutcomes.length}
                          </span>{" "}
                          characters remaining
                        </>
                      }
                    />
                )}

                {!isFutureEngagement && (
                  <FastField
                    name="nextSteps"
                    label={Settings.fields.report.nextSteps}
                    component={FieldHelper.InputField}
                    componentClass="textarea"
                    onChange={event => {
                      setFieldTouched("nextSteps", true, false)
                      setFieldValue("nextSteps", event.target.value, false)
                      validateFieldDebounced("nextSteps")
                    }}
                    maxLength={Settings.maxTextFieldLength}
                    onKeyUp={event =>
                      countCharsLeft(
                        "nextStepsCharsLeft",
                        Settings.maxTextFieldLength,
                        event
                      )}
                    extraColElem={
                      <>
                        <span id="nextStepsCharsLeft">
                          {Settings.maxTextFieldLength -
                            initialValues.nextSteps.length}
                        </span>{" "}
                        characters remaining
                      </>
                    }
                  />
                )}

                <FastField
                  name="reportText"
                  label={Settings.fields.report.reportText}
                  component={FieldHelper.SpecialField}
                  onChange={value => setFieldValue("reportText", value, true)}
                  widget={
                    <RichTextEditor
                      className="reportTextField"
                      onHandleBlur={() => {
                        // validation will be done by setFieldValue
                        setFieldTouched("reportText", true, false)
                      }}
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
                  {(values.reportSensitiveInformation || !edit) && (
                    <div>
                      <FastField
                        name="reportSensitiveInformation.text"
                        component={FieldHelper.SpecialField}
                        label="Report sensitive information text"
                        onChange={value =>
                          setFieldValue(
                            "reportSensitiveInformation.text",
                            value,
                            true
                          )}
                        widget={
                          <RichTextEditor
                            className="reportSensitiveInformationField"
                            onHandleBlur={() => {
                              // validation will be done by setFieldValue
                              setFieldTouched(
                                "reportSensitiveInformation.text",
                                true,
                                false
                              )
                            }}
                          />
                        }
                      />
                      <FastField
                        name="authorizationGroups"
                        label="Authorization Groups"
                        component={FieldHelper.SpecialField}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("authorizationGroups", true, false) // onBlur doesn't work when selecting an option
                          setFieldValue("authorizationGroups", value, true)
                        }}
                        widget={
                          <AdvancedMultiSelect
                            fieldName="authorizationGroups"
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
                            objectType={AuthorizationGroup}
                            queryParams={{
                              status: AuthorizationGroup.STATUS.ACTIVE
                            }}
                            fields={AuthorizationGroup.autocompleteQuery}
                            addon={<Icon icon={IconNames.LOCK} />}
                          />
                        }
                        extraColElem={
                          <>
                            <FieldHelper.FieldShortcuts
                              title="Recent Authorization Groups"
                              shortcuts={recents.authorizationGroups}
                              fieldName="authorizationGroups"
                              objectType={AuthorizationGroup}
                              curValue={values.authorizationGroups}
                              onChange={value => {
                                // validation will be done by setFieldValue
                                setFieldTouched(
                                  "authorizationGroups",
                                  true,
                                  false
                                ) // onBlur doesn't work when selecting an option
                                setFieldValue(
                                  "authorizationGroups",
                                  value,
                                  true
                                )
                              }}
                              handleAddItem={
                                FieldHelper.handleMultiSelectAddItem
                              }
                            />
                          </>
                        }
                      />
                    </div>
                  )}
                </Collapse>
              </Fieldset>

              <Fieldset
                title="Engagement assessments"
                id="engagement-assessments"
              >
                {values.tasks.map(task => {
                  if (!task.customFields) {
                    return null
                  }
                  const taskCustomFields = JSON.parse(task.customFields)
                  if (!taskCustomFields.assessmentDefinition) {
                    return null
                  }
                  const taskAssessmentDefinition = JSON.parse(
                    taskCustomFields.assessmentDefinition
                  )
                  return (
                    <CustomFieldsContainer
                      key={`assessment-${values.uuid}-${task.uuid}`}
                      fieldNamePrefix={`taskAssessments.${task.uuid}`}
                      fieldsConfig={taskAssessmentDefinition}
                      formikProps={{
                        setFieldTouched,
                        setFieldValue,
                        values,
                        validateForm
                      }}
                    />
                  )
                })}
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
                        onConfirmDelete(values.uuid, resetForm)}
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
                    onClick={() =>
                      onSubmit(values, { resetForm, setSubmitting })}
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
    setFieldValue(field, attendees, true)
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
      save(autoSaveSettings.values, false)
        .then(response => {
          const newValues = _cloneDeep(autoSaveSettings.values)
          Object.assign(newValues, response)
          if (newValues.reportSensitiveInformation === null) {
            newValues.reportSensitiveInformation = {} // object must exist for Collapse children
          }
          // After successful autosave, reset the form with the new values in order to make sure the dirty
          // prop is also reset (otherwise we would get a blocking navigation warning)
          const touched = _cloneDeep(autoSaveSettings.touched) // save previous touched
          form.resetForm({ values: newValues })
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
        history.push("/", { success: "Report deleted" })
      })
      .catch(error => {
        setSaveError(error)
        jumpToTop()
      })
  }

  function onCancel() {
    history.goBack()
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

  function onSubmitSuccess(report, values, resetForm) {
    const edit = isEditMode(values)
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    resetForm()
    if (!edit) {
      history.replace(Report.pathForEdit(report))
    }
    history.push(Report.pathFor(report), {
      success: `${getReportTypeUpperFirst(values)} saved`
    })
  }

  function isEmptyTaskAssessment(assessment) {
    return (
      (Object.keys(assessment).length === 1 &&
        Object.keys(assessment)[0] === "invisibleCustomFields") ||
      _isEmpty(assessment)
    )
  }

  function createTaskAssessmentsNotes(values, reportUuid) {
    const selectedTasksUuids = values.tasks.map(t => t.uuid)
    return Object.keys(values.taskAssessments)
      .filter(
        key =>
          selectedTasksUuids.includes(key) &&
          !isEmptyTaskAssessment(values.taskAssessments[key])
      )
      .map(key => {
        const taskAssessment = _cloneDeep(values.taskAssessments[key])
        delete taskAssessment.invisibleCustomFields
        const noteObj = {
          type: NOTE_TYPE.ASSESSMENT,
          noteRelatedObjects: [
            {
              relatedObjectType: "tasks",
              relatedObjectUuid: key
            },
            {
              relatedObjectType: "reports",
              relatedObjectUuid: reportUuid
            }
          ],
          text: JSON.stringify(taskAssessment)
        }
        const initialAssessmentUuid = values.taskToAssessmentUuid[key]
        if (initialAssessmentUuid) {
          noteObj.uuid = initialAssessmentUuid
        }
        return noteObj
      })
  }
  function save(values, sendEmail) {
    const report = Object.without(
      new Report(values),
      "notes",
      "cancelled",
      "reportTags",
      "showSensitiveInfo",
      "attendees",
      "tasks",
      "customFields", // initial JSON from the db
      "formCustomFields",
      "taskAssessments",
      "taskToAssessmentUuid"
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
      Object.without(
        a,
        "firstName",
        "lastName",
        "position",
        "customFields",
        "formCustomFields"
      )
    )
    // strip tasks fields not in data model
    report.tasks = values.tasks.map(t => utils.getReference(t))
    report.location = utils.getReference(report.location)
    report.customFields = customFieldsJSONString(values)
    const edit = isEditMode(values)
    const operation = edit ? "updateReport" : "createReport"
    const variables = { report }
    return _saveReport(edit, variables, sendEmail).then(response => {
      const report = response[operation]
      const updateNotesVariables = { report }
      updateNotesVariables.notes = createTaskAssessmentsNotes(
        values,
        report.uuid
      )
      return API.mutation(
        GQL_UPDATE_REPORT_ASSESSMENTS,
        updateNotesVariables
      ).then(() => report)
    })
  }

  function _saveReport(edit, variables, sendEmail) {
    if (edit) {
      variables.sendEditEmail = sendEmail
      // Add an additional mutation to create notes for the taskAssessments
      return API.mutation(GQL_UPDATE_REPORT, variables)
    } else {
      return API.mutation(GQL_CREATE_REPORT, variables)
    }
  }
}

BaseReportForm.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  initialValues: PropTypes.instanceOf(Report).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  showSensitiveInfo: PropTypes.bool,
  currentUser: PropTypes.instanceOf(Person)
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

export default connect(null, mapPageDispatchersToProps)(ReportForm)
