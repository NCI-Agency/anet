import { gql } from "@apollo/client"
import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  AuthorizationGroupOverlayRow,
  EventOverlayRow,
  PersonDetailedOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import {
  HierarchicalLocationOverlayTable,
  locationFields
} from "components/advancedSelectWidget/HierarchicalLocationOverlayTable"
import {
  HierarchicalTaskOverlayTable,
  taskFields
} from "components/advancedSelectWidget/HierarchicalTaskOverlayTable"
import { ENTITY_TYPES } from "components/advancedSelectWidget/MultiTypeAdvancedSelectComponent"
import AppContext from "components/AppContext"
import InstantAssessmentsContainerField from "components/assessments/instant/InstantAssessmentsContainerField"
import UploadAttachment from "components/Attachment/UploadAttachment"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import ConfirmDestructive from "components/ConfirmDestructive"
import CustomDateInput from "components/CustomDateInput"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Leaflet, { ICON_TYPES } from "components/Leaflet"
import { MessagesWithConflict } from "components/Messages"
import Model, {
  ASSESSMENTS_RELATED_OBJECT_TYPE,
  EXCLUDED_ASSESSMENT_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS
} from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { RelatedObjectsTableInput } from "components/RelatedObjectsTable"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _cloneDeep from "lodash/cloneDeep"
import _debounce from "lodash/debounce"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import _upperFirst from "lodash/upperFirst"
import {
  AuthorizationGroup,
  Event,
  Location,
  Person,
  Position,
  Report,
  Task
} from "models"
import moment from "moment"
import CreateNewLocation from "pages/locations/CreateNewLocation"
import { RECURRENCE_TYPE } from "periodUtils"
import pluralize from "pluralize"
import React, { useContext, useEffect, useRef, useState } from "react"
import { Button, Collapse, Form as FormBS } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import COMMUNITIES_ICON from "resources/communities.png"
import EVENTS_ICON from "resources/events.png"
import LOCATIONS_ICON from "resources/locations.png"
import PEOPLE_ICON from "resources/people.png"
import TASKS_ICON from "resources/tasks.png"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"
import ReportPeople, {
  forceOnlyAttendingPersonPerRoleToPrimary
} from "./ReportPeople"

const reportPeopleAutocompleteQuery = `
  ${Person.autocompleteQuery}
  previousPositions {
    startTime
    endTime
    position {
      uuid
      name
      code
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      organization {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      location {
        uuid
        name
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
    }
  }
`

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
        ${Location.autocompleteQuery}
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
        ${reportPeopleAutocompleteQuery}
      }
    }
    taskList(query: $taskQuery) {
      list {
        ${Task.autocompleteQuery}
      }
    }
  }
`
const GQL_CREATE_REPORT = gql`
  mutation ($report: ReportInput!) {
    createReport(report: $report) {
      uuid
      updatedAt
      state
      authors {
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
  mutation ($report: ReportInput!, $sendEditEmail: Boolean!, $force: Boolean) {
    updateReport(
      report: $report
      sendEditEmail: $sendEditEmail
      force: $force
    ) {
      uuid
      updatedAt
      state
      authors {
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
  mutation ($uuid: String!) {
    deleteReport(uuid: $uuid)
  }
`
const GQL_UPDATE_REPORT_ASSESSMENTS = gql`
  mutation ($uuid: String, $assessments: [AssessmentInput]) {
    updateReportAssessments(reportUuid: $uuid, assessments: $assessments)
  }
`

const GQL_GET_EVENT_COUNT = gql`
  query ($eventQuery: EventSearchQueryInput) {
    eventList(query: $eventQuery) {
      totalCount
    }
  }
`
const AUTOSAVE_TIMEOUT = process.env.ANET_TEST_MODE === "true" ? 300 : 30

interface ReportFormProps {
  pageDispatchers?: PageDispatchersPropType
  initialValues: any
  title?: string
  edit?: boolean
  showSensitiveInfo?: boolean
  notesComponent?: React.ReactNode
}

function getEventMinDate(eventStartDate?: Date) {
  return !eventStartDate || Settings?.eventsIncludeStartAndEndTime
    ? eventStartDate
    : moment(eventStartDate).startOf("day").toDate()
}

function getEventMaxDate(eventEndDate?: Date) {
  return !eventEndDate || Settings?.eventsIncludeStartAndEndTime
    ? eventEndDate
    : moment(eventEndDate).endOf("day").toDate()
}

const ReportForm = ({
  pageDispatchers,
  edit = false,
  title = "",
  initialValues,
  showSensitiveInfo: ssi = false,
  notesComponent
}: ReportFormProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(ssi)
  const [saveError, setSaveError] = useState(null)
  const [autoSavedAt, setAutoSavedAt] = useState(null)
  // We need the report tasks/attendees in order to be able to dynamically
  // update the yup schema for the selected tasks/attendees instant assessments
  const [reportTasks, setReportTasks] = useState(initialValues.tasks)
  const [reportPeople, setReportPeople] = useState(initialValues.reportPeople)
  const [attachmentList, setAttachmentList] = useState(
    initialValues?.attachments
  )
  const [showCustomFields, setShowCustomFields] = useState(
    !!Settings.fields.report.customFields
  )
  // To check if there is a visit ban in the location
  const [locationUuid, setLocationUuid] = useState(
    initialValues?.location?.uuid
  )
  const [engagementDate, setEngagementDate] = useState(
    initialValues?.engagementDate
  )
  const [visitBan, setVisitBan] = useState(false)
  // some autosave settings
  const defaultTimeout = moment.duration(AUTOSAVE_TIMEOUT, "seconds")
  const autoSaveSettings = useRef({
    autoSaveTimeout: defaultTimeout.clone(),
    timeoutId: null,
    dirty: false,
    values: {}
  })
  const autoSaveActive = useRef(true)
  useEffect(() => {
    autoSaveActive.current = true

    // Stop auto-save from running/rescheduling after unmount
    return () => {
      autoSaveActive.current = false
    }
  })

  useEffect(() => {
    async function checkPotentiallyUnavailableLocation(
      engagementDate,
      locationUuid
    ) {
      // When engagement date or location uuid changes we need to call the back-end to figure out if there is a VISIT BAN event
      // that applies to the location in the engagement date. If so we need to warn the user.
      if (engagementDate && locationUuid) {
        const eventQuery = {
          pageSize: 1,
          type: Event.EVENT_TYPES.VISIT_BAN,
          locationUuid,
          includeDate: getEventMinDate(engagementDate)
        }
        try {
          const response = await API.query(GQL_GET_EVENT_COUNT, {
            eventQuery
          })
          setVisitBan(response?.eventList.totalCount > 0)
        } catch (error) {
          setSaveError(error)
          setVisitBan(false)
          jumpToTop()
        }
      } else {
        setVisitBan(false)
      }
    }
    checkPotentiallyUnavailableLocation(engagementDate, locationUuid)
  }, [engagementDate, locationUuid])

  const recentTasksVarCommon = {
    pageSize: 6,
    status: Model.STATUS.ACTIVE,
    selectable: true,
    sortBy: "RECENT",
    sortOrder: "DESC"
  }

  let recentTasksVarUser
  if (currentUser.isAdmin()) {
    recentTasksVarUser = recentTasksVarCommon
  } else {
    recentTasksVarUser = {
      ...recentTasksVarCommon,
      inMyReports: true
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
  const submitText = "Save Report"
  const tasksLabel = pluralize(Settings.fields.task.shortLabel)
  const showAssignedPositionWarning = !currentUser.hasAssignedPosition()
  const showActivePositionWarning =
    currentUser.hasAssignedPosition() && !currentUser.hasActivePosition()
  const alertStyle = { marginBottom: "1rem", textAlign: "center", zIndex: "-1" }
  const supportEmail = Settings.SUPPORT_EMAIL_ADDR
  const supportEmailMessage = supportEmail ? `at ${supportEmail}` : ""
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser.isAdmin())
  const canCreateLocation =
    Settings.regularUsersCanCreateLocations || currentUser.isSuperuser()
  const classificationButtons = utils.getConfidentialityLabelChoices()

  let recents = []
  if (data) {
    recents = {
      locations: data.locationList.list,
      persons: data.personList.list,
      tasks: data.taskList.list
    }
  }

  const isAuthor = initialValues.reportPeople?.some(
    a => a.author && Person.isEqual(currentUser, a)
  )
  // User can approve if report is pending approval and user is one of the approvers in the current approval step
  const canApprove =
    Report.isPending(initialValues.state) &&
    initialValues.approvalStep?.approvers?.some(member =>
      Position.isEqual(member, currentUser?.position)
    )
  const canReadAssessments = isAuthor || canApprove
  const canWriteAssessments =
    canReadAssessments && !Report.isPublished(initialValues.state)

  const reportSchema = Report.getReportSchema(
    initialValues,
    reportTasks,
    reportPeople
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
        // need up-to-date copies of these in the autosave handler
        Object.assign(autoSaveSettings.current, { dirty, values, touched })
        if (autoSaveActive.current && !autoSaveSettings.current.timeoutId) {
          // Schedule the auto-save timer
          const autosaveHandler = () => autoSave(resetForm, setFieldTouched)
          autoSaveSettings.current.timeoutId = window.setTimeout(
            autosaveHandler,
            autoSaveSettings.current.autoSaveTimeout.asMilliseconds()
          )
        }

        if (!validateFieldDebounced) {
          validateFieldDebounced = _debounce(validateField, 400)
        }
        const currentOrg =
          currentUser.position && currentUser.position.organization

        const locationFilters = Location.getReportLocationFilters()
        const reportPeopleFilters = {
          all: {
            label: "All",
            queryVars: { matchPositionName: true, pendingVerification: false }
          }
        }
        if (currentOrg) {
          reportPeopleFilters.myColleagues = {
            label: "My colleagues",
            queryVars: {
              matchPositionName: true,
              pendingVerification: false,
              orgUuid: currentOrg.uuid
            }
          }
          reportPeopleFilters.myCounterparts = {
            label: "My counterparts",
            list: currentUser.position.associatedPositions
              .filter(ap => ap.person)
              .map(ap => ap.person)
          }
        }
        if (values.location && values.location.uuid) {
          reportPeopleFilters.atLocation = {
            label: `At ${values.location.name}`,
            queryVars: {
              locationUuid:
                values.location && values.location.uuid
                  ? values.location.uuid
                  : null
            }
          }
        }

        // Add attendee groups defined in the dictionary
        const attendeeGroups =
          Settings.fields.report.reportPeople?.attendeeGroups ?? []
        attendeeGroups.forEach(({ label, filter: queryVars }) => {
          reportPeopleFilters[label] = { label, queryVars }
        })

        const tasksFilters = {}

        if (values.event?.uuid) {
          tasksFilters.assignedToEvent = {
            label: `Assigned to event ${values.event.name}`,
            queryVars: {
              eventUuid: values.event.uuid,
              selectable: true
            }
          }
        }

        if (currentOrg) {
          tasksFilters.assignedToMyOrg = {
            label: `Assigned to ${currentOrg.shortName}`,
            queryVars: {
              taskedOrgUuid: currentOrg.uuid,
              orgRecurseStrategy: RECURSE_STRATEGY.PARENTS,
              selectable: true
            }
          }
        }
        const primaryAdvisors = values.reportPeople.filter(
          a => !a.interlocutor && a.primary && a.attendee
        )
        const primaryAdvisor = primaryAdvisors.length
          ? primaryAdvisors[0]
          : null
        if (
          primaryAdvisor?.position?.organization &&
          primaryAdvisor.position.organization.uuid !== currentOrg?.uuid
        ) {
          tasksFilters.assignedToReportOrg = {
            label: `Assigned to ${primaryAdvisor.position.organization.shortName}`,
            queryVars: {
              taskedOrgUuid: primaryAdvisor.position.organization.uuid,
              orgRecurseStrategy: RECURSE_STRATEGY.PARENTS,
              selectable: true
            }
          }
        }

        tasksFilters.allUnassignedTasks = {
          label: `All unassigned ${tasksLabel}`,
          queryVars: { selectable: true, isAssigned: false }
        }

        const eventFilters = Event.getReportEventFilters()

        if (currentUser.isAdmin()) {
          tasksFilters.allTasks = {
            label: `All ${tasksLabel}`,
            queryVars: { selectable: true }
          }
        }

        const reportCommunitiesFilters = {
          allEntities: {
            label: "Communities of interest",
            queryVars: { distributionList: true }
          }
        }

        const authorizationGroupsFilters = {
          allEntities: {
            label: "Communities for sensitive information",
            queryVars: { forSensitiveInformation: true }
          }
        }

        // Only an author can delete a report, and only in DRAFT or REJECTED state.
        const canDelete =
          !!values.uuid &&
          (Report.isDraft(values.state) || Report.isRejected(values.state)) &&
          isAuthor
        // Skip validation on save!
        const action = (
          <>
            <Button
              variant="primary"
              onClick={() => onSubmit(values, { resetForm, setSubmitting })}
              disabled={isSubmitting}
            >
              {submitText}
            </Button>
            {notesComponent}
          </>
        )
        const isFutureEngagement = Report.isFuture(values.engagementDate)
        const hasAssessments = values.engagementDate && !isFutureEngagement
        const relatedObject = hasAssessments ? values : {}
        const locationDisabled =
          values.event?.uuid && values.event?.location?.uuid

        return (
          <div className="report-form">
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <MessagesWithConflict
              error={saveError}
              objectType="Report"
              onCancel={onCancel}
              onConfirm={() => {
                resetForm({ values, isSubmitting: true })
                onSubmit(values, { resetForm, setSubmitting }, true)
              }}
            />

            {showAssignedPositionWarning && (
              <div className="alert alert-warning" style={alertStyle}>
                You cannot submit a report: you are not assigned to a position.
                <br />
                Please contact your organization's superuser(s) and request to
                be assigned to a position.
                <br />
                If you are unsure, you can also contact the support team{" "}
                {supportEmailMessage}.
              </div>
            )}

            {showActivePositionWarning && (
              <div className="alert alert-warning" style={alertStyle}>
                You cannot submit a report: your assigned position has an
                inactive status.
                <br />
                Please contact your organization's superusers and request them
                to assign you to an active position.
                <br />
                If you are unsure, you can also contact the support team{" "}
                {supportEmailMessage}.
              </div>
            )}

            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.confidentialityLabel}
                  name="classification"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={classificationButtons}
                  enableClear
                  onChange={value => setFieldValue("classification", value)}
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.report.intent}
                  name="intent"
                  component={FieldHelper.InputField}
                  asA="textarea"
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
                    )
                  }
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

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.report.engagementDate}
                  name="engagementDate"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    setFieldTouched("engagementDate", true, false) // onBlur doesn't work when selecting a date
                    setFieldValue("engagementDate", value, true)
                    setEngagementDate(value)
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
                    <FormBS.Text>
                      <span className="text-success">
                        This will create a planned engagement
                      </span>
                    </FormBS.Text>
                  )}
                </DictionaryField>

                {Settings.engagementsIncludeTimeAndDuration && (
                  <DictionaryField
                    wrappedComponent={FastField}
                    dictProps={Settings.fields.report.duration}
                    name="duration"
                    component={FieldHelper.InputField}
                    inputType="number"
                    onWheelCapture={event => event.currentTarget.blur()} // Prevent scroll action on number input
                    onChange={event => {
                      const safeVal =
                        utils.preventNegativeAndLongDigits(
                          event.target.value,
                          4
                        ) || null
                      setFieldTouched("duration", true, false)
                      setFieldValue("duration", safeVal, false)
                      validateFieldDebounced("duration")
                    }}
                  />
                )}

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.report.event}
                  name="event"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("event", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("event", value, true)
                    setFieldValue("location", value?.location)
                    setLocationUuid(value?.location?.uuid)
                    // If event selected and engagementDate empty assign start date of the event
                    if (value?.startDate && !engagementDate) {
                      setFieldValue("engagementDate", value?.startDate)
                    }
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="event"
                      placeholder={Settings.fields.report.event.placeholder}
                      value={values.event}
                      overlayColumns={["Name"]}
                      overlayRenderRow={EventOverlayRow}
                      filterDefs={eventFilters}
                      objectType={Event}
                      fields={Event.autocompleteQuery}
                      valueKey="name"
                      addon={EVENTS_ICON}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.report.location}
                  name="location"
                  component={FieldHelper.SpecialField}
                  disabled={locationDisabled}
                  widget={
                    <>
                      <AdvancedSingleSelect
                        fieldName="location"
                        placeholder={
                          Settings.fields.report.location.placeholder
                        }
                        value={values.location}
                        overlayColumns={["Name"]}
                        overlayTable={HierarchicalLocationOverlayTable}
                        restrictSelectableItems
                        filterDefs={locationFilters}
                        objectType={Location}
                        fields={locationFields}
                        valueKey="name"
                        addon={LOCATIONS_ICON}
                        pageSize={0}
                        showRemoveButton={!locationDisabled}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
                          setFieldValue("location", value, true)
                          setLocationUuid(value?.uuid)
                        }}
                        createEntityComponent={
                          !canCreateLocation
                            ? null
                            : (searchTerms, setDoReset) => (
                                <CreateNewLocation
                                  name={searchTerms}
                                  setFieldTouched={setFieldTouched}
                                  setFieldValue={setFieldValue}
                                  setDoReset={setDoReset}
                                />
                              )
                        }
                      />
                      {!locationDisabled && (
                        <div className="mt-3">
                          <Leaflet
                            mapId="report-location"
                            markers={
                              values.location &&
                              Location.hasCoordinates(values.location)
                                ? [
                                    {
                                      id:
                                        values.location.uuid ||
                                        `${values.location.lat},${values.location.lng}`,
                                      lat: Number(values.location.lat),
                                      lng: Number(values.location.lng),
                                      name: values.location.name,
                                      icon: ICON_TYPES.DEFAULT
                                    }
                                  ]
                                : []
                            }
                            anetLocationsSelected
                            onSelectLocation={(loc: any) => {
                              setFieldTouched("location", true, false)
                              setFieldValue("location", loc, true)
                              setLocationUuid(loc.uuid)
                            }}
                          />
                        </div>
                      )}
                    </>
                  }
                  extraColElem={
                    <>
                      {visitBan ? (
                        <Button variant="outline-secondary">
                          <Icon
                            icon={IconNames.WARNING_SIGN}
                            intent={Intent.WARNING}
                            size={IconSize.STANDARD}
                            style={{ margin: "0 6px" }}
                          />
                          This location might not be available at the engagement
                          date due to a visit ban!
                        </Button>
                      ) : undefined}
                      <FieldHelper.FieldShortcuts
                        title="Recent Locations"
                        shortcuts={
                          !values.event?.uuid &&
                          recents.locations.filter(
                            l => values.location?.uuid !== l.uuid
                          )
                        }
                        fieldName="location"
                        objectType={Location}
                        curValue={values.location}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("location", true, false) // onBlur doesn't work when selecting an option
                          setFieldValue("location", value, true)
                          setLocationUuid(value?.uuid)
                        }}
                        handleAddItem={FieldHelper.handleSingleSelectAddItem}
                      />
                    </>
                  }
                />

                {!isFutureEngagement && (
                  <DictionaryField
                    wrappedComponent={FastField}
                    dictProps={Settings.fields.report.cancelled}
                    name="cancelled"
                    component={FieldHelper.SpecialField}
                    widget={
                      <FormBS.Check
                        type="checkbox"
                        label="This engagement was cancelled"
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
                          )
                        }
                      />
                    }
                  />
                )}
                {!isFutureEngagement && values.cancelled && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.report.cancelledReason}
                    name="cancelledReason"
                    component={FieldHelper.SpecialField}
                    onChange={event => {
                      // validation will be done by setFieldValue
                      setFieldValue("cancelledReason", event.target.value, true)
                    }}
                    widget={
                      <FormBS.Select className="cancelled-reason-form-group">
                        {cancelledReasonOptions.map(reason => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </FormBS.Select>
                    }
                  />
                )}

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.report.reportCommunities}
                  name="reportCommunities"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("reportCommunities", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("reportCommunities", value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="reportCommunities"
                      value={values.reportCommunities}
                      renderSelected={
                        <AuthorizationGroupTable
                          authorizationGroups={values.reportCommunities}
                          noAuthorizationGroupsMessage={`No ${Settings.fields.report.reportCommunities?.label} selected; click in the box above to select any`}
                          showDelete
                        />
                      }
                      overlayColumns={["Name"]}
                      overlayRenderRow={AuthorizationGroupOverlayRow}
                      filterDefs={reportCommunitiesFilters}
                      objectType={AuthorizationGroup}
                      fields={AuthorizationGroup.autocompleteQuery}
                      addon={COMMUNITIES_ICON}
                    />
                  }
                />
              </Fieldset>

              <Fieldset
                title={
                  !values.cancelled && !isFutureEngagement
                    ? "People involved in this engagement"
                    : "People who will be involved in this planned engagement"
                }
                id="reportPeople-fieldset"
              >
                <Field
                  name="reportPeople"
                  label="Attendees"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    updateReportPeople(
                      setFieldValue,
                      setFieldTouched,
                      "reportPeople",
                      value
                    )
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="reportPeople"
                      placeholder="Search for people involved in this engagement…"
                      value={values.reportPeople}
                      renderSelected={
                        <ReportPeople
                          report={
                            new Report({
                              uuid: values.uuid,
                              engagementDate: values.engagementDate,
                              duration: Number.parseInt(values.duration) || 0,
                              reportPeople: values.reportPeople
                            })
                          }
                          onChange={value =>
                            setFieldValue("reportPeople", value, true)
                          }
                          showDelete
                        />
                      }
                      overlayColumns={[
                        "Name",
                        "Position",
                        "Location",
                        "Organization"
                      ]}
                      overlayRenderRow={item =>
                        PersonDetailedOverlayRow(item, values.engagementDate)
                      }
                      filterDefs={reportPeopleFilters}
                      objectType={Person}
                      queryParams={{
                        status: Model.STATUS.ACTIVE,
                        pendingVerification: false
                      }}
                      fields={reportPeopleAutocompleteQuery}
                      addon={PEOPLE_ICON}
                    />
                  }
                  extraColElem={
                    <>
                      <FieldHelper.FieldShortcuts
                        title="Recent attendees"
                        shortcuts={recents.persons.filter(
                          ra =>
                            !values.reportPeople?.find(
                              person => person.uuid === ra.uuid
                            )
                        )}
                        fieldName="reportPeople"
                        objectType={Person}
                        curValue={values.reportPeople}
                        onChange={value => {
                          updateReportPeople(
                            setFieldValue,
                            setFieldTouched,
                            "reportPeople",
                            value
                          )
                        }}
                        handleAddItem={FieldHelper.handleMultiSelectAddItem}
                      />
                    </>
                  }
                />
              </Fieldset>

              {!_isEmpty(tasksFilters) && (
                <Fieldset
                  title={Settings.fields.task.longLabel}
                  className="tasks-selector"
                >
                  <Field
                    name="tasks"
                    label={Settings.fields.task.longLabel}
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
                        placeholder={`Search for ${tasksLabel}…`}
                        value={values.tasks}
                        renderSelected={
                          <NoPaginationTaskTable
                            id="tasks-tasks"
                            tasks={values.tasks}
                            showDelete
                            showDescription
                            noTasksMessage={`No ${tasksLabel} selected; click in the ${tasksLabel} box to view your organization's ${tasksLabel}`}
                          />
                        }
                        overlayColumns={[Settings.fields.task.shortLabel]}
                        overlayTable={HierarchicalTaskOverlayTable}
                        restrictSelectableItems
                        filterDefs={tasksFilters}
                        objectType={Task}
                        queryParams={{ status: Model.STATUS.ACTIVE }}
                        fields={taskFields}
                        addon={TASKS_ICON}
                        pageSize={0}
                      />
                    }
                    extraColElem={
                      <>
                        <FieldHelper.FieldShortcuts
                          title={`Recent ${tasksLabel}`}
                          shortcuts={recents.tasks.filter(
                            rt =>
                              !values.tasks?.find(task => task.uuid === rt.uuid)
                          )}
                          fieldName="tasks"
                          objectType={Task}
                          curValue={values.tasks}
                          onChange={value => {
                            // validation will be done by setFieldValue
                            setFieldTouched("tasks", true, false) // onBlur doesn't work when selecting an option
                            setFieldValue("tasks", value, true)
                            setReportTasks(value)
                          }}
                          handleAddItem={FieldHelper.handleMultiSelectAddItem}
                        />
                      </>
                    }
                  />
                </Fieldset>
              )}

              <Fieldset title="Engagement details" id="meeting-details">
                {!isFutureEngagement && !values.cancelled && (
                  <>
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={Settings.fields.report.atmosphere}
                      name="atmosphere"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      enableClear={Settings.fields.report.atmosphere?.optional}
                      buttons={atmosphereButtons}
                      onChange={value =>
                        setFieldValue("atmosphere", value, true)
                      }
                      className="atmosphere-form-group"
                    />
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.report.atmosphereDetails}
                      name="atmosphereDetails"
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
                      className="atmosphere-details"
                    />
                  </>
                )}

                {Settings.fields.report.keyOutcomes &&
                  !isFutureEngagement &&
                  !values.cancelled && (
                    <DictionaryField
                      wrappedComponent={FastField}
                      dictProps={Settings.fields.report.keyOutcomes}
                      name="keyOutcomes"
                      component={FieldHelper.InputField}
                      asA="textarea"
                      onChange={event => {
                        setFieldTouched("keyOutcomes", true, false)
                        setFieldValue("keyOutcomes", event.target.value, false)
                        validateFieldDebounced("keyOutcomes")
                      }}
                      maxLength={Settings.maxTextFieldLength}
                      onKeyUp={event =>
                        countCharsLeft(
                          "keyOutcomesCharsLeft",
                          Settings.maxTextFieldLength,
                          event
                        )
                      }
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
                  <DictionaryField
                    wrappedComponent={FastField}
                    dictProps={Settings.fields.report.nextSteps}
                    name="nextSteps"
                    component={FieldHelper.InputField}
                    asA="textarea"
                    onChange={event => {
                      setFieldTouched("nextSteps", true, false)
                      setFieldValue("nextSteps", event.target.value, false)
                      validateFieldDebounced("nextSteps")
                    }}
                    maxLength={utils.getMaxTextFieldLength(
                      Settings.fields.report.nextSteps
                    )}
                    onKeyUp={event =>
                      countCharsLeft(
                        "nextStepsCharsLeft",
                        utils.getMaxTextFieldLength(
                          Settings.fields.report.nextSteps
                        ),
                        event
                      )
                    }
                    extraColElem={
                      <>
                        <span id="nextStepsCharsLeft">
                          {utils.getMaxTextFieldLength(
                            Settings.fields.report.nextSteps
                          ) - initialValues.nextSteps.length}
                        </span>{" "}
                        characters remaining
                      </>
                    }
                  />
                )}

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.report.reportText}
                  name="reportText"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // prevent initial unnecessary render of RichTextEditor
                    if (!_isEqual(values.reportText, value)) {
                      setFieldValue("reportText", value, true)
                    }
                  }}
                  onHandleBlur={() => {
                    // validation will be done by setFieldValue
                    setFieldTouched("reportText", true, false)
                  }}
                  widget={
                    <RichTextEditor
                      className="reportTextField"
                      placeholder={
                        Settings.fields.report.reportText?.placeholder
                      }
                    />
                  }
                />

                {attachmentEditEnabled && (
                  <Field
                    name="uploadAttachments"
                    label="Attachments"
                    component={FieldHelper.SpecialField}
                    widget={
                      <UploadAttachment
                        attachments={attachmentList}
                        updateAttachments={setAttachmentList}
                        relatedObjectType={Report.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                        saveRelatedObject={() =>
                          saveReportForm(
                            values,
                            touched,
                            resetForm,
                            setFieldTouched
                          )
                        }
                      />
                    }
                    onHandleBlur={() => {
                      setFieldTouched("uploadAttachments", true, false)
                    }}
                  />
                )}

                <div style={{ textAlign: "center" }}>
                  <Button
                    variant="outline-secondary"
                    className="center-block toggle-section-button"
                    style={{
                      marginBottom: "1rem"
                    }}
                    onClick={toggleReportText}
                    id="toggleSensitiveInfo"
                  >
                    {showSensitiveInfo ? "Hide" : "Add"} sensitive information
                  </Button>
                </div>

                <Collapse in={showSensitiveInfo}>
                  {(values.reportSensitiveInformation || !edit) && (
                    <div>
                      <FastField
                        name="reportSensitiveInformation.text"
                        component={FieldHelper.SpecialField}
                        label="Report sensitive information text"
                        onChange={value => {
                          const safeVal = value || null
                          // prevent initial unnecessary render of RichTextEditor
                          if (
                            !_isEqual(
                              values.reportSensitiveInformation.text,
                              safeVal
                            )
                          ) {
                            setFieldValue(
                              "reportSensitiveInformation.text",
                              safeVal,
                              true
                            )
                          }
                        }}
                        onHandleBlur={() => {
                          // validation will be done by setFieldValue
                          setFieldTouched(
                            "reportSensitiveInformation.text",
                            true,
                            false
                          )
                        }}
                        widget={
                          <RichTextEditor className="reportSensitiveInformationField" />
                        }
                      />
                      <FastField
                        name="authorizedMembers"
                        label="Authorized Members"
                        component={FieldHelper.SpecialField}
                        widget={
                          <RelatedObjectsTableInput
                            title="Authorized Members"
                            relatedObjects={values.authorizedMembers}
                            objectType={ENTITY_TYPES.AUTHORIZATION_GROUPS}
                            entityTypes={[
                              ENTITY_TYPES.AUTHORIZATION_GROUPS,
                              ENTITY_TYPES.POSITIONS,
                              ENTITY_TYPES.ORGANIZATIONS,
                              ENTITY_TYPES.PEOPLE
                            ]}
                            entityFilters={[
                              {
                                [ENTITY_TYPES.AUTHORIZATION_GROUPS]:
                                  authorizationGroupsFilters
                              }
                            ]}
                            setRelatedObjects={value =>
                              setFieldValue("authorizedMembers", value)
                            }
                            showDelete
                          />
                        }
                      />
                    </div>
                  )}
                </Collapse>
              </Fieldset>

              {showCustomFields && (
                <Fieldset title="Engagement information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.report.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                    setShowCustomFields={setShowCustomFields}
                  />
                </Fieldset>
              )}

              {hasAssessments && (
                <>
                  <Fieldset
                    title="Attendees engagement assessments"
                    id="attendees-engagement-assessments"
                  >
                    <InstantAssessmentsContainerField
                      entityType={Person}
                      entities={values.reportPeople?.filter(rp => rp.attendee)}
                      relatedObject={relatedObject}
                      parentFieldName={
                        Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD
                      }
                      formikProps={{
                        setFieldTouched,
                        setFieldValue,
                        values,
                        validateForm
                      }}
                      canRead={canReadAssessments}
                      canWrite={canWriteAssessments}
                    />
                  </Fieldset>

                  <Fieldset
                    title={`${Settings.fields.task.longLabel} engagement assessments`}
                    id="tasks-engagement-assessments"
                  >
                    <InstantAssessmentsContainerField
                      entityType={Task}
                      entities={values.tasks}
                      relatedObject={relatedObject}
                      parentFieldName={Report.TASKS_ASSESSMENTS_PARENT_FIELD}
                      formikProps={{
                        setFieldTouched,
                        setFieldValue,
                        values,
                        validateForm
                      }}
                      canRead={canReadAssessments}
                      canWrite={canWriteAssessments}
                    />
                  </Fieldset>
                </>
              )}

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
                    Cancel
                  </Button>
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
                    <ConfirmDestructive
                      onConfirm={() => onConfirmDelete(values, resetForm)}
                      objectType="report"
                      objectDisplay={values.uuid}
                      variant="danger"
                      buttonLabel={`Delete this ${getReportType(values)}`}
                      buttonDisabled={isSubmitting}
                    />
                  )}
                  {/* Skip validation on save! */}
                  <Button
                    id="formBottomSubmit"
                    variant="primary"
                    onClick={() =>
                      onSubmit(values, { resetForm, setSubmitting })
                    }
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

  function updateReportPeople(
    setFieldValue,
    setFieldTouched,
    field,
    reportPeople
  ) {
    // validation will be done by setFieldValue
    setFieldTouched(field, true, false) // onBlur doesn't work when selecting an option
    const newPeopleList = reportPeople.map(rp => new Person(rp))

    newPeopleList.forEach(rp => {
      // After selecting a person, default to attending, unless it is intentionally set to false (by attendee checkbox)
      rp.attendee = rp.attendee ?? true
      // Similarly, if not intentionally made author, default is not an author
      rp.author = rp.author ?? false

      // Set default primary flag to false unless set
      // Make sure field is 'controlled' by defining a value
      rp.primary = rp.primary ?? false

      // Set default interlocutor flag to true if not an ANET user (or false if it is an ANET user),
      // unless it has explicitly been set.
      // Make sure field is 'controlled' by defining a value
      rp.interlocutor = rp.interlocutor ?? !rp.user
    })

    // if no one else is primary, set that person primary if attending
    forceOnlyAttendingPersonPerRoleToPrimary(newPeopleList)
    setFieldValue(field, newPeopleList, true)
    setReportPeople(newPeopleList)
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

  function saveReportForm(values, touched, resetForm, setFieldTouched) {
    return save(values, false).then(response => {
      const newValues = _cloneDeep(values)
      Object.assign(newValues, response)
      if (newValues.reportSensitiveInformation === null) {
        // object must exist for Collapse children
        newValues.reportSensitiveInformation = { uuid: null, text: null }
      }
      // After successful save of the form, reset the form with the new values in order to make
      // sure the dirty prop is also reset (otherwise we would get a blocking navigation warning).
      // First save original 'touched' state
      const origTouched = _cloneDeep(touched)
      // Then reset form with new values
      resetForm({ values: newValues })
      // And restore original 'touched' state, so we keep messages
      Object.entries(origTouched).forEach(([field, value]) =>
        setFieldTouched(field, value)
      )
      return newValues
    })
  }

  function autoSave(resetForm, setFieldTouched) {
    if (!autoSaveActive.current) {
      // We're done auto-saving
      return
    }

    const autosaveHandler = () => autoSave(resetForm, setFieldTouched)
    // Only auto-save if the report has changed
    if (!autoSaveSettings.current.dirty) {
      // Just re-schedule the auto-save timer
      autoSaveSettings.current.timeoutId = window.setTimeout(
        autosaveHandler,
        autoSaveSettings.current.autoSaveTimeout.asMilliseconds()
      )
    } else {
      saveReportForm(
        autoSaveSettings.current.values,
        autoSaveSettings.current.touched,
        resetForm,
        setFieldTouched
      )
        .then(response => {
          autoSaveSettings.current.autoSaveTimeout = defaultTimeout.clone() // reset to default
          setAutoSavedAt(moment())
          toast.success(
            `Your ${getReportType(response)} has been automatically saved`
          )
          autoSaveSettings.current.dirty = false
          // And re-schedule the auto-save timer
          autoSaveSettings.current.timeoutId = window.setTimeout(
            autosaveHandler,
            autoSaveSettings.current.autoSaveTimeout.asMilliseconds()
          )
        })
        .catch(error => {
          if (utils.isConflictError(error)) {
            setSaveError(error)
            jumpToTop()
          } else {
            // Show an error message
            autoSaveSettings.current.autoSaveTimeout.add(
              autoSaveSettings.current.autoSaveTimeout
            ) // exponential back-off
            toast.warning(
              `There was an error autosaving your ${getReportType(
                autoSaveSettings.current.values
              )}; we'll try again in ${autoSaveSettings.current.autoSaveTimeout.humanize()}`
            )
            // And re-schedule the auto-save timer
            autoSaveSettings.current.timeoutId = window.setTimeout(
              autosaveHandler,
              autoSaveSettings.current.autoSaveTimeout.asMilliseconds()
            )
          }
        })
    }
  }

  function onConfirmDelete(values, resetForm) {
    API.mutation(GQL_DELETE_REPORT, { uuid: values.uuid })
      .then(() => {
        // reset the form to latest values
        // to avoid unsaved changes prompt if it somehow becomes dirty
        resetForm({ values, isSubmitting: true })
        navigate("/", { state: { success: "Report deleted" } })
      })
      .catch(error => {
        setSaveError(error)
        jumpToTop()
      })
  }

  function onCancel() {
    navigate(-1)
  }

  function onSubmit(values, form, force) {
    form.setSubmitting(true)
    return save(values, true, force)
      .then(response => onSubmitSuccess(response, values, form.resetForm))
      .catch(error => {
        setSaveError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(report, values, resetForm) {
    const edit = isEditMode(values)
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    resetForm({ values, isSubmitting: true })
    if (!edit) {
      navigate(Report.pathForEdit(report), { replace: true })
    }
    navigate(Report.pathFor(report), {
      state: { success: `${getReportTypeUpperFirst(values)} saved` }
    })
  }

  function isEmptyAssessment(assessment) {
    return (
      Object.entries(assessment).filter(
        ([key, value]) =>
          !EXCLUDED_ASSESSMENT_FIELDS.includes(key) &&
          value !== null &&
          value !== undefined &&
          !utils.isEmptyHtml(value)
      ).length < 1
    )
  }

  function createInstantAssessments(
    entityType,
    entities,
    values,
    assessmentsFieldName,
    assessmentsUuidsFieldName,
    reportUuid
  ) {
    const entitiesUuids = entities.map(e => e.uuid)
    const valuesCopy = _cloneDeep(values)
    const assessments = []
    const entitiesAssessments = Object.entries(
      valuesCopy[assessmentsFieldName]
    ).filter(([entityUuid, instantAssessments]) => {
      Object.entries(instantAssessments).forEach(([ak, assessmentValues]) => {
        if (isEmptyAssessment(assessmentValues)) {
          delete instantAssessments[ak]
        }
      })
      return entitiesUuids.includes(entityUuid)
    })
    entitiesAssessments.forEach(([entityUuid, instantAssessment]) => {
      Object.entries(instantAssessment).forEach(([ak, assessmentValues]) => {
        const entity = entities.find(e => e.uuid === entityUuid)
        const dictionaryPath = entity.getAssessmentDictionaryPath()
        Model.clearInvalidAssessmentQuestions(
          assessmentValues,
          entity,
          new Report(values),
          entity.getInstantAssessmentConfig(ak)
        )
        assessmentValues.__recurrence = RECURRENCE_TYPE.ONCE
        assessmentValues.__relatedObjectType =
          ASSESSMENTS_RELATED_OBJECT_TYPE.REPORT
        const assessmentObj = {
          assessmentRelatedObjects: [
            {
              relatedObjectType: entityType.relatedObjectType,
              relatedObjectUuid: entityUuid
            },
            {
              relatedObjectType: Report.relatedObjectType,
              relatedObjectUuid: reportUuid
            }
          ],
          assessmentKey: `${dictionaryPath}.${ak}`,
          assessmentValues: customFieldsJSONString(
            valuesCopy,
            true,
            `${assessmentsFieldName}.${entityUuid}.${ak}`
          )
        }
        const initialAssessmentUuid =
          values[assessmentsUuidsFieldName]?.[entityUuid]?.[ak]
        if (initialAssessmentUuid) {
          assessmentObj.uuid = initialAssessmentUuid
        }
        assessments.push(assessmentObj)
      })
    })
    return assessments
  }

  function save(values, sendEmail, force) {
    const report = Report.filterClientSideFields(new Report(values))
    report.authorizedMembers = values.authorizedMembers.map(
      ({ relatedObjectType, relatedObjectUuid }) => ({
        relatedObjectType,
        relatedObjectUuid
      })
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
    // strip reportPeople fields not in data model
    report.reportPeople = values.reportPeople.map(reportPerson => {
      const rp = Person.filterClientSideFields(
        reportPerson,
        "position",
        "customFields"
      )
      rp.author = !!reportPerson.author
      rp.attendee = !!reportPerson.attendee
      rp.interlocutor = !!reportPerson.interlocutor
      return rp
    })
    // strip tasks fields not in data model
    report.tasks = values.tasks.map(t => utils.getReference(t))
    report.location = utils.getReference(report.location)
    report.event = utils.getReference(report.event)
    report.reportCommunities = values.reportCommunities.map(rc =>
      utils.getReference(rc)
    )
    report.customFields = customFieldsJSONString(values)
    const edit = isEditMode(values)
    const operation = edit ? "updateReport" : "createReport"
    const variables = { report, force }
    return _saveReport(edit, variables, sendEmail).then(response => {
      const report = response[operation]
      if (!canWriteAssessments) {
        // Skip updating assessments!
        return report
      }
      // Update assessments
      const tasksAssessments = createInstantAssessments(
        Task,
        values.tasks,
        values,
        Report.TASKS_ASSESSMENTS_PARENT_FIELD,
        Report.TASKS_ASSESSMENTS_UUIDS_FIELD,
        report.uuid
      )
      const attendeesAssessments = createInstantAssessments(
        Person,
        values.reportPeople?.filter(rp => rp.attendee),
        values,
        Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD,
        Report.ATTENDEES_ASSESSMENTS_UUIDS_FIELD,
        report.uuid
      )
      const updateAssessmentsVariables = {
        uuid: report.uuid,
        assessments: tasksAssessments.concat(attendeesAssessments)
      }
      return API.mutation(
        GQL_UPDATE_REPORT_ASSESSMENTS,
        updateAssessmentsVariables
      ).then(() => report)
    })
  }

  function _saveReport(edit, variables, sendEmail) {
    if (edit) {
      variables.sendEditEmail = sendEmail
      return API.mutation(GQL_UPDATE_REPORT, variables)
    } else {
      return API.mutation(GQL_CREATE_REPORT, variables)
    }
  }
}

const atmosphereButtons = [
  {
    id: "positiveAtmos",
    value: Report.ATMOSPHERE.POSITIVE,
    label: Report.ATMOSPHERE_LABELS[Report.ATMOSPHERE.POSITIVE]
  },
  {
    id: "neutralAtmos",
    value: Report.ATMOSPHERE.NEUTRAL,
    label: Report.ATMOSPHERE_LABELS[Report.ATMOSPHERE.NEUTRAL]
  },
  {
    id: "negativeAtmos",
    value: Report.ATMOSPHERE.NEGATIVE,
    label: Report.ATMOSPHERE_LABELS[Report.ATMOSPHERE.NEGATIVE]
  }
]

const cancelledReasonOptions = [
  {
    value: "CANCELLED_BY_ADVISOR",
    label: `Cancelled by ${Settings.fields.advisor.person.name}`
  },
  {
    value: "CANCELLED_BY_INTERLOCUTOR",
    label: `Cancelled by ${Settings.fields.interlocutor.person.name}`
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
  },
  {
    value: "CANCELLED_DUE_TO_NETWORK_ISSUES",
    label: "Cancelled due to Network / Connectivity Issues"
  }
]
export default connect(null, mapPageDispatchersToProps)(ReportForm)
