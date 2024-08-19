import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  EventSeriesOverlayRow,
  LocationOverlayRow,
  OrganizationOverlayRow
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
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import _isEqual from "lodash/isEqual"
import { Event, EventSeries, Location, Organization, Task } from "models"
import CreateNewLocation from "pages/locations/CreateNewLocation"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button, FormSelect } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import LOCATIONS_ICON from "resources/locations.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import TASKS_ICON from "resources/tasks.png"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"
import { TaskOverlayRow } from "../../components/advancedSelectWidget/AdvancedSelectOverlayRow"

const EVENT_TYPES = [
  Event.EVENT_TYPES.CONFERENCE,
  Event.EVENT_TYPES.EXERCISE,
  Event.EVENT_TYPES.VISIT_BAN,
  Event.EVENT_TYPES.OTHER
]

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
    taskList(query: $taskQuery) {
      list {
        ${Task.autocompleteQuery}
      }
    }
  }
`

const organizationAutocompleteQuery = `${Organization.autocompleteQuery} ascendantOrgs { uuid app6context app6standardIdentity parentOrg { uuid } }`
const eventSeriesAutocompleteQuery = EventSeries.autocompleteQuery

const EventForm = ({
  pageDispatchers,
  edit,
  title,
  initialValues,
  notesComponent
}) => {
  const { loadAppData, currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState(null)
  const [minDate, setMinDate] = useState(
    initialValues ? initialValues.startDate : null
  )
  const [maxDate, setMaxDate] = useState(
    initialValues ? initialValues.endDate : null
  )
  const tasksLabel = pluralize(Settings.fields.task.shortLabel)

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

  let recents = []
  if (data) {
    recents = {
      locations: data.locationList.list,
      tasks: data.taskList.list
    }
  }
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
        validateForm,
        submitForm
      }) => {
        const isAdmin = currentUser && currentUser.isAdmin()
        const canCreateLocation =
          Settings.regularUsersCanCreateLocations || currentUser.isSuperuser()

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

        const currentOrg =
          currentUser.position && currentUser.position.organization

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
            queryVars: {}
          }
        }

        const eventSeriesFilters = {
          allEventSeries: {
            label: "All event series",
            queryVars: {}
          }
        }

        const tasksFilters = {}

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

        tasksFilters.allUnassignedTasks = {
          label: `All unassigned ${tasksLabel}`,
          queryVars: { selectable: true, isAssigned: false }
        }

        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={saveError} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.eventSeries}
                  name="eventSeries"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("eventSeries", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("eventSeries", value)
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
                      fields={eventSeriesAutocompleteQuery}
                      queryParams={eventSeriesSearchQuery}
                      valueKey="name"
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
                      fields={organizationAutocompleteQuery}
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
                      fields={organizationAutocompleteQuery}
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
                          overlayRenderRow={TaskOverlayRow}
                          filterDefs={tasksFilters}
                          objectType={Task}
                          queryParams={{ status: Model.STATUS.ACTIVE }}
                          fields={Task.autocompleteQuery}
                          addon={TASKS_ICON}
                        />
                      }
                      extraColElem={
                        <>
                          <FieldHelper.FieldShortcuts
                            title={`Recent ${tasksLabel}`}
                            shortcuts={recents.tasks.filter(
                              rt =>
                                !values.tasks?.find(
                                  task => task.uuid === rt.uuid
                                )
                            )}
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
                )}
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
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.event.name}
                  name="name"
                  component={FieldHelper.InputField}
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
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.event.startDate}
                  name="startDate"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    setFieldTouched("startDate", true, false) // onBlur doesn't work when selecting a date
                    setFieldValue("startDate", value, true)
                    setMinDate(new Date(value))
                  }}
                  onBlur={() => setFieldTouched("startDate")}
                  widget={
                    <CustomDateInput
                      id="startDate"
                      withTime={Settings.engagementsIncludeTimeAndDuration}
                      maxDate={maxDate}
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
                    setMaxDate(new Date(value))
                  }}
                  onBlur={() => setFieldTouched("endDate")}
                  widget={
                    <CustomDateInput
                      id="endDate"
                      withTime={Settings.engagementsIncludeTimeAndDuration}
                      minDate={minDate}
                    />
                  }
                />
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
    event.hostOrg = utils.getReference(event.hostOrg)
    event.adminOrg = utils.getReference(event.adminOrg)
    event.location = utils.getReference(event.location)
    return API.mutation(
      edit ? Event.getUpdateEventMutation : Event.getCreateEventMutation,
      {
        event
      }
    ).then()
  }
}

EventForm.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  initialValues: PropTypes.instanceOf(Event).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  notesComponent: PropTypes.node
}

EventForm.defaultProps = {
  title: "",
  edit: false
}

export default connect(null, mapPageDispatchersToProps)(EventForm)
