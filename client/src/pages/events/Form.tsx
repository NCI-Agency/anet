import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  EventSeriesOverlayRow,
  LocationOverlayRow,
  OrganizationOverlayRow,
  PersonSimpleOverlayRow,
  TaskOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import CustomDateInput from "components/CustomDateInput"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import NoPaginationOrganizationTable from "components/NoPaginationOrganizationTable"
import NoPaginationPersonTable from "components/NoPaginationPersonTable"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import { jumpToTop } from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import {
  Event,
  EventSeries,
  Location,
  Organization,
  Person,
  Task
} from "models"
import moment from "moment/moment"
import CreateNewLocation from "pages/locations/CreateNewLocation"
import pluralize from "pluralize"
import React, { useContext, useState } from "react"
import { Button, FormSelect } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import EVENT_SERIES_ICON from "resources/eventSeries.png"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import PEOPLE_ICON from "resources/people.png"
import TASKS_ICON from "resources/tasks.png"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"

const GQL_CREATE_EVENT = gql`
  mutation ($event: EventInput!) {
    createEvent(event: $event) {
      uuid
    }
  }
`

const GQL_UPDATE_EVENT = gql`
  mutation ($event: EventInput!) {
    updateEvent(event: $event)
  }
`

const EVENT_TYPES = [
  Event.EVENT_TYPES.CONFERENCE,
  Event.EVENT_TYPES.EXERCISE,
  Event.EVENT_TYPES.VISIT_BAN,
  Event.EVENT_TYPES.OTHER
]

interface EventFormProps {
  initialValues: any
  title?: string
  edit?: boolean
  notesComponent: React.ReactNode
}

const EventForm = ({
  edit = false,
  title = "",
  initialValues,
  notesComponent
}: EventFormProps) => {
  const { loadAppData, currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState(null)
  const tasksLabel = pluralize(Settings.fields.task.shortLabel)
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Model.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Model.STATUS.INACTIVE,
      label: "Inactive"
    }
  ]

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Event.yupSchema}
      initialValues={initialValues}
    >
      {({
        isSubmitting,
        dirty,
        setFieldValue,
        setFieldTouched,
        values,
        submitForm
      }) => {
        const isAdmin = currentUser && currentUser.isAdmin()
        const canCreateLocation =
          Settings.regularUsersCanCreateLocations || currentUser.isSuperuser()

        const ownerOrgSearchQuery = { status: Model.STATUS.ACTIVE }
        const hostOrgSearchQuery = { status: Model.STATUS.ACTIVE }
        const adminOrgSearchQuery = { status: Model.STATUS.ACTIVE }
        const eventSeriesSearchQuery = {}

        // Superusers can select parent organizations among the ones their position is administrating
        if (!isAdmin) {
          const orgsAdministratedUuids =
            currentUser.position.organizationsAdministrated.map(org => org.uuid)
          adminOrgSearchQuery.parentOrgUuid = [
            currentUser.position.organization.uuid,
            ...orgsAdministratedUuids
          ]
          adminOrgSearchQuery.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN

          eventSeriesSearchQuery.adminOrgUuid = [
            currentUser.position.organization.uuid,
            ...orgsAdministratedUuids
          ]
        }
        const locationFilters = Location.getReportLocationFilters()

        const action = (
          <>
            <Button key="submit" variant="primary" onClick={submitForm}>
              Save Event
            </Button>
            {notesComponent}
          </>
        )
        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: { status: Model.STATUS.ACTIVE }
          }
        }

        const peopleFilters = {
          allOrganizations: {
            label: "All people",
            queryVars: {
              status: Model.STATUS.ACTIVE
            }
          }
        }

        const eventSeriesFilters = {
          allEventSeries: {
            label: "All event series",
            queryVars: {
              status: Model.STATUS.ACTIVE
            }
          }
        }

        const tasksFilters = {}

        tasksFilters.allTasks = {
          label: `All ${tasksLabel}`,
          queryVars: { selectable: true }
        }

        if (values.ownerOrg) {
          tasksFilters.assignedToOwnerOrg = {
            label: `Assigned to ${values.ownerOrg.shortName}`,
            queryVars: {
              taskedOrgUuid: values.ownerOrg.uuid,
              orgRecurseStrategy: RECURSE_STRATEGY.PARENTS,
              selectable: true
            }
          }
        }

        if (values.hostOrg && values.hostOrg.uuid !== values.ownerOrg?.uuid) {
          tasksFilters.assignedToHostOrg = {
            label: `Assigned to ${values.hostOrg.shortName}`,
            queryVars: {
              taskedOrgUuid: values.hostOrg.uuid,
              orgRecurseStrategy: RECURSE_STRATEGY.PARENTS,
              selectable: true
            }
          }
        }

        if (
          values.adminOrg &&
          values.adminOrg.uuid !== values.ownerOrg?.uuid &&
          values.adminOrg.uuid !== values.hostOrg?.uuid
        ) {
          tasksFilters.assignedToAdminOrg = {
            label: `Assigned to ${values.adminOrg.shortName}`,
            queryVars: {
              taskedOrgUuid: values.adminOrg.uuid,
              orgRecurseStrategy: RECURSE_STRATEGY.PARENTS,
              selectable: true
            }
          }
        }

        const initialMonthForStartDate = moment(
          values.startDate ?? values.endDate ?? new Date()
        ).toDate()
        const initialMonthForEndDate = moment(
          values.endDate ?? values.startDate ?? new Date()
        ).toDate()
        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={saveError} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.event.name}
                  name="name"
                  component={FieldHelper.InputField}
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.eventSeries}
                  name="eventSeries"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("eventSeries", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("eventSeries", value)
                    setFieldValue("ownerOrg", value?.ownerOrg)
                    setFieldValue("hostOrg", value?.hostOrg)
                    setFieldValue("adminOrg", value?.adminOrg)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="eventSeries"
                      placeholder={
                        Settings.fields.event.eventSeries.placeholder
                      }
                      value={values.eventSeries}
                      overlayColumns={["Name"]}
                      overlayRenderRow={EventSeriesOverlayRow}
                      filterDefs={eventSeriesFilters}
                      objectType={EventSeries}
                      fields={EventSeries.autocompleteQuery}
                      queryParams={eventSeriesSearchQuery}
                      valueKey="name"
                      addon={EVENT_SERIES_ICON}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.ownerOrg}
                  name="ownerOrg"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("ownerOrg", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("ownerOrg", value)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="ownerOrg"
                      placeholder={Settings.fields.event.ownerOrg.placeholder}
                      value={values.ownerOrg}
                      overlayColumns={["Name"]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={organizationFilters}
                      objectType={Organization}
                      fields={Organization.autocompleteQuery}
                      queryParams={ownerOrgSearchQuery}
                      valueKey="shortName"
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.hostOrg}
                  name="hostOrg"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("hostOrg", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("hostOrg", value)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="hostOrg"
                      placeholder={Settings.fields.event.hostOrg.placeholder}
                      value={values.hostOrg}
                      overlayColumns={["Name"]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={organizationFilters}
                      objectType={Organization}
                      fields={Organization.autocompleteQuery}
                      queryParams={hostOrgSearchQuery}
                      valueKey="shortName"
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.adminOrg}
                  name="adminOrg"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("adminOrg", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("adminOrg", value)
                  }}
                  widget={
                    <AdvancedSingleSelect
                      fieldName="adminOrg"
                      placeholder={Settings.fields.event.adminOrg.placeholder}
                      value={values.adminOrg}
                      overlayColumns={["Name"]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={organizationFilters}
                      objectType={Organization}
                      fields={Organization.autocompleteQuery}
                      queryParams={adminOrgSearchQuery}
                      valueKey="shortName"
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.event.location}
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
                      placeholder={Settings.fields.event.location.placeholder}
                      value={values.location}
                      overlayColumns={["Name"]}
                      overlayRenderRow={LocationOverlayRow}
                      filterDefs={locationFilters}
                      objectType={Location}
                      fields={Location.autocompleteQuery}
                      valueKey="name"
                      addon={LOCATIONS_ICON}
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
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.event.type}
                  name="type"
                  component={FieldHelper.SpecialField}
                  onChange={event => {
                    // validation will be done by setFieldValue
                    setFieldValue("type", event.target.value, true)
                  }}
                  widget={
                    <FormSelect className="location-type-form-group form-control">
                      <option value="">Please select an event type</option>
                      {EVENT_TYPES.map(type => (
                        <option key={type} value={type}>
                          {Event.humanNameOfType(type)}
                        </option>
                      ))}
                    </FormSelect>
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.startDate}
                  name="startDate"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    setFieldTouched("startDate", true, false) // onBlur doesn't work when selecting a date
                    setFieldValue("startDate", value, true)
                  }}
                  onBlur={() => setFieldTouched("startDate")}
                  widget={
                    <CustomDateInput
                      id="startDate"
                      withTime={Settings.eventsIncludeStartAndEndTime}
                      initialMonth={initialMonthForStartDate}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.endDate}
                  name="endDate"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    setFieldTouched("endDate", true, false) // onBlur doesn't work when selecting a date
                    setFieldValue("endDate", value, true)
                  }}
                  onBlur={() => setFieldTouched("endDate")}
                  widget={
                    <CustomDateInput
                      id="endDate"
                      withTime={Settings.eventsIncludeStartAndEndTime}
                      initialMonth={initialMonthForEndDate}
                    />
                  }
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.event.status}
                  name="status"
                  component={FieldHelper.RadioButtonToggleGroupField}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.event.description}
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
                      className="reportTextField"
                      placeholder={
                        Settings.fields.event.description?.placeholder
                      }
                    />
                  }
                />
                <Field
                  name="organizations"
                  label="Organizations attending"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("organizations", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("organizations", value, true)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="organizations"
                      placeholder="Search for organizations…"
                      value={values.organizations}
                      renderSelected={
                        <NoPaginationOrganizationTable
                          id="events-organizations"
                          organizations={values.organizations}
                          showDelete
                          noOrganizationsMessage="No Organizations currently assigned to this event. Click in the Organizations attending box to select organizations."
                        />
                      }
                      overlayColumns={[Settings.fields.organization.shortLabel]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={organizationFilters}
                      objectType={Organization}
                      queryParams={{ status: Model.STATUS.ACTIVE }}
                      fields={Organization.autocompleteQuery}
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />
                <Field
                  name="people"
                  label="People attending"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("people", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("people", value, true)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="people"
                      placeholder="Search for people…"
                      value={values.people}
                      renderSelected={
                        <NoPaginationPersonTable
                          id="events-people"
                          people={values.people}
                          showDelete
                          noPeopleMessage="No People currently assigned to this event. Click in the People attending box to select people."
                        />
                      }
                      overlayColumns={[Settings.fields.person.shortLabel]}
                      overlayRenderRow={PersonSimpleOverlayRow}
                      filterDefs={peopleFilters}
                      objectType={Person}
                      queryParams={{ status: Model.STATUS.ACTIVE }}
                      fields={Person.autocompleteQuery}
                      addon={PEOPLE_ICON}
                    />
                  }
                />
                {!_isEmpty(tasksFilters) && (
                  <Field
                    name="tasks"
                    label={Settings.fields.task.longLabel}
                    component={FieldHelper.SpecialField}
                    onChange={value => {
                      // validation will be done by setFieldValue
                      setFieldTouched("tasks", true, false) // onBlur doesn't work when selecting an option
                      setFieldValue("tasks", value, true)
                    }}
                    widget={
                      <AdvancedMultiSelect
                        fieldName="tasks"
                        placeholder={`Search for ${tasksLabel}…`}
                        value={values.tasks}
                        renderSelected={
                          <NoPaginationTaskTable
                            id="events-tasks"
                            tasks={values.tasks}
                            showDelete
                            showDescription
                            noTasksMessage={`No ${tasksLabel} selected; click in the ${tasksLabel} box to view ${tasksLabel}`}
                          />
                        }
                        overlayColumns={[Settings.fields.task.shortLabel]}
                        overlayRenderRow={TaskOverlayRow}
                        filterDefs={tasksFilters}
                        objectType={Task}
                        queryParams={{ status: Model.STATUS.ACTIVE }}
                        fields={Task.autocompleteQuery}
                        addon={TASKS_ICON}
                      />
                    }
                  />
                )}
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.event.outcomes}
                  name="outcomes"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // prevent initial unnecessary render of RichTextEditor
                    if (!_isEqual(values.outcomes, value)) {
                      setFieldValue("outcomes", value, true)
                    }
                  }}
                  onHandleBlur={() => {
                    // validation will be done by setFieldValue
                    setFieldTouched("outcomes", true, false)
                  }}
                  widget={
                    <RichTextEditor
                      className="reportTextField"
                      placeholder={Settings.fields.event.outcomes?.placeholder}
                    />
                  }
                />
              </Fieldset>
              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel} variant="outline-secondary">
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
                    Save Event
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function onCancel() {
    navigate(-1)
  }

  function onSubmit(values, form) {
    return save(values)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setSaveError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const operation = edit ? "updateEvent" : "createEvent"
    const event = new Event({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    loadAppData()
    if (!edit) {
      navigate(Event.pathForEdit(event), { replace: true })
    }
    navigate(Event.pathFor(event), {
      state: { success: "Event saved" }
    })
  }

  function save(values) {
    const event = Event.filterClientSideFields(new Event(values))
    // strip tasks fields not in data model
    event.tasks = values.tasks.map(t => utils.getReference(t))
    // strip organization fields not in data model
    event.organizations = values.organizations.map(t => utils.getReference(t))
    // strip person fields not in data model
    event.people = values.people.map(t => utils.getReference(t))
    event.ownerOrg = utils.getReference(event.ownerOrg)
    event.hostOrg = utils.getReference(event.hostOrg)
    event.adminOrg = utils.getReference(event.adminOrg)
    event.location = utils.getReference(event.location)
    return API.mutation(edit ? GQL_UPDATE_EVENT : GQL_CREATE_EVENT, {
      event
    })
  }
}

export default EventForm
