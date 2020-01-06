import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  OrganizationOverlayRow,
  PositionOverlayRow,
  TaskSimpleOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import CustomDateInput from "components/CustomDateInput"
import { CustomFieldsContainer } from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { GRAPHQL_NOTE_FIELDS, NOTE_TYPE } from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import PositionTable from "components/PositionTable"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Form, Formik } from "formik"
import _set from "lodash/set"
import { Organization, Person, Position, Task } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"
import DictionaryField from "../../HOC/DictionaryField"

const GQL_CREATE_TASK = gql`
  mutation($task: TaskInput!) {
    createTask(task: $task) {
      uuid
    }
  }
`
const GQL_UPDATE_TASK = gql`
  mutation($task: TaskInput!, $withNote: Boolean!, $note: NoteInput) {
    updateTask(task: $task)
    createNote(note: $note) @include(if: $withNote) {
      ${GRAPHQL_NOTE_FIELDS}
    }
  }
`

const BaseTaskForm = props => {
  const { currentUser, edit, title, initialValues, ...myFormProps } = props
  const history = useHistory()
  const [error, setError] = useState(null)
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Task.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Task.STATUS.INACTIVE,
      label: "Inactive"
    }
  ]

  const ShortNameField = DictionaryField(FastField)
  const LongNameField = DictionaryField(FastField)
  const TaskCustomFieldRef1 = DictionaryField(AdvancedSingleSelect)
  const TaskCustomField = DictionaryField(FastField)
  const PlannedCompletionField = DictionaryField(FastField)
  const ProjectedCompletionField = DictionaryField(FastField)
  const TaskCustomFieldEnum1 = DictionaryField(FastField)
  const TaskCustomFieldEnum2 = DictionaryField(FastField)
  const ResponsiblePositionsMultiSelect = DictionaryField(AdvancedMultiSelect)

  initialValues.assessment_customFieldEnum1 = ""

  const orgSearchQuery = {
    status: Organization.STATUS.ACTIVE,
    type: Organization.TYPE.ADVISOR_ORG
  }

  if (currentUser && currentUser.isSuperUser() && !currentUser.isAdmin()) {
    Object.assign(orgSearchQuery, {
      parentOrgUuid: currentUser.position.organization.uuid,
      parentOrgRecursively: true
    })
  }

  const responsibleOrgFilters = {
    allOrganizations: {
      label: "All organizations",
      queryVars: {}
    }
  }

  const tasksFilters = {
    allTasks: {
      label: "All tasks",
      queryVars: {}
    }
  }
  const positionsFilters = {
    allAdvisorPositions: {
      label: "All advisor positions",
      queryVars: {
        status: Position.STATUS.ACTIVE,
        type: [
          Position.TYPE.ADVISOR,
          Position.TYPE.SUPER_USER,
          Position.TYPE.ADMINISTRATOR
        ],
        matchPersonName: true
      }
    }
  }

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Task.yupSchema}
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
        submitForm
      }) => {
        const action = (
          <div>
            <Button
              key="submit"
              bsStyle="primary"
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save {Settings.fields.task.shortLabel}
            </Button>
          </div>
        )
        return (
          <div>
            <NavigationWarning isBlocking={dirty} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <ShortNameField
                  dictProps={Settings.fields.task.shortName}
                  name="shortName"
                  component={FieldHelper.renderInputField}
                />

                <LongNameField
                  dictProps={Settings.fields.task.longName}
                  name="longName"
                  component={FieldHelper.renderInputField}
                />

                <FastField
                  name="status"
                  component={FieldHelper.renderRadioButtonToggleGroup}
                  buttons={statusButtons}
                  onChange={value => setFieldValue("status", value)}
                />

                <AdvancedSingleSelect
                  fieldName="responsibleOrg"
                  fieldLabel={Settings.fields.task.responsibleOrg}
                  placeholder={`Select a responsible organization for this ${Settings.fields.task.shortLabel}`}
                  value={values.responsibleOrg}
                  overlayColumns={["Name"]}
                  overlayRenderRow={OrganizationOverlayRow}
                  filterDefs={responsibleOrgFilters}
                  onChange={value => setFieldValue("responsibleOrg", value)}
                  objectType={Organization}
                  fields={Organization.autocompleteQuery}
                  valueKey="shortName"
                  queryParams={orgSearchQuery}
                  addon={ORGANIZATIONS_ICON}
                />

                <ResponsiblePositionsMultiSelect
                  fieldName="responsiblePositions"
                  dictProps={Settings.fields.task.responsiblePositions}
                  fieldLabel={Settings.fields.task.responsiblePositions.label}
                  value={values.responsiblePositions}
                  renderSelected={
                    <PositionTable
                      positions={values.responsiblePositions}
                      showDelete
                    />
                  }
                  overlayColumns={[
                    "Position",
                    "Organization",
                    "Current Occupant"
                  ]}
                  overlayRenderRow={PositionOverlayRow}
                  filterDefs={positionsFilters}
                  onChange={value =>
                    setFieldValue("responsiblePositions", value)}
                  objectType={Position}
                  fields={Position.autocompleteQuery}
                  addon={POSITIONS_ICON}
                />

                {Settings.fields.task.customFieldRef1 && (
                  <TaskCustomFieldRef1
                    dictProps={Settings.fields.task.customFieldRef1}
                    fieldName="customFieldRef1"
                    fieldLabel={Settings.fields.task.customFieldRef1.label}
                    placeholder={
                      Settings.fields.task.customFieldRef1.placeholder
                    }
                    value={values.customFieldRef1}
                    overlayColumns={["Name"]}
                    overlayRenderRow={TaskSimpleOverlayRow}
                    filterDefs={tasksFilters}
                    onChange={value => setFieldValue("customFieldRef1", value)}
                    objectType={Task}
                    fields={Task.autocompleteQuery}
                    valueKey="shortName"
                    queryParams={{}}
                    addon={TASKS_ICON}
                  />
                )}

                <TaskCustomField
                  dictProps={Settings.fields.task.customField}
                  name="customField"
                  component={FieldHelper.renderInputField}
                />

                {Settings.fields.task.plannedCompletion && (
                  <PlannedCompletionField
                    dictProps={Settings.fields.task.plannedCompletion}
                    name="plannedCompletion"
                    component={FieldHelper.renderSpecialField}
                    onChange={value =>
                      setFieldValue("plannedCompletion", value)}
                    onBlur={() => setFieldTouched("plannedCompletion")}
                    widget={<CustomDateInput id="plannedCompletion" />}
                  />
                )}

                {Settings.fields.task.projectedCompletion && (
                  <ProjectedCompletionField
                    dictProps={Settings.fields.task.projectedCompletion}
                    name="projectedCompletion"
                    component={FieldHelper.renderSpecialField}
                    onChange={value =>
                      setFieldValue("projectedCompletion", value)}
                    onBlur={() => setFieldTouched("projectedCompletion")}
                    widget={<CustomDateInput id="projectedCompletion" />}
                  />
                )}

                {Settings.fields.task.customFieldEnum1 && (
                  <>
                    <TaskCustomFieldEnum1
                      dictProps={Object.without(
                        Settings.fields.task.customFieldEnum1,
                        "enum"
                      )}
                      name="customFieldEnum1"
                      component={FieldHelper.renderRadioButtonToggleGroup}
                      buttons={FieldHelper.customEnumButtons(
                        Settings.fields.task.customFieldEnum1.enum
                      )}
                      onChange={value =>
                        setFieldValue("customFieldEnum1", value)}
                    />
                    {edit && (
                      <FastField
                        name="assessment_customFieldEnum1"
                        label={`Assessment of ${Settings.fields.task.customFieldEnum1.label}`}
                        component={FieldHelper.renderSpecialField}
                        onChange={value =>
                          setFieldValue("assessment_customFieldEnum1", value)}
                        widget={
                          <RichTextEditor
                            className="textField"
                            onHandleBlur={() => {
                              // validation will be done by setFieldValue
                              setFieldTouched(
                                "assessment_customFieldEnum1",
                                true,
                                false
                              )
                            }}
                          />
                        }
                      />
                    )}
                  </>
                )}

                {Settings.fields.task.customFieldEnum2 && (
                  <TaskCustomFieldEnum2
                    dictProps={Object.without(
                      Settings.fields.task.customFieldEnum2,
                      "enum"
                    )}
                    name="customFieldEnum2"
                    component={FieldHelper.renderRadioButtonToggleGroup}
                    buttons={FieldHelper.customEnumButtons(
                      Settings.fields.task.customFieldEnum2.enum
                    )}
                    onChange={value => setFieldValue("customFieldEnum2", value)}
                  />
                )}
              </Fieldset>

              {Settings.fields.person.customFields && (
                <Fieldset
                  title={`${Settings.fields.task.shortLabel} information`}
                  id="custom-fields"
                >
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.task.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values
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
                    Save {Settings.fields.task.shortLabel}
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
    history.goBack()
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const { edit } = props
    const operation = edit ? "updateTask" : "createTask"
    const task = new Task({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : props.initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    history.replace(Task.pathForEdit(task))
    if (!edit) {
      history.replace(Task.pathForEdit(task))
    }
    history.push(Task.pathFor(task), {
      success: "Task saved"
    })
  }

  function save(values, form) {
    const task = Object.without(
      new Task(values),
      "notes",
      "assessment_customFieldEnum1",
      "customFields", // initial JSON from the db
      "formCustomFields"
    )
    task.responsibleOrg = utils.getReference(task.responsibleOrg)
    task.customFieldRef1 = utils.getReference(task.customFieldRef1)
    // customFields should contain the JSON of all the visible custom fields
    values.formCustomFields.invisibleCustomFields.forEach(f => {
      _set(values, f.split("."), undefined)
    })
    task.customFields = JSON.stringify(values.formCustomFields)
    const { edit } = props
    const variables = { task: task }
    if (
      edit &&
      (props.initialValues.customFieldEnum1 !== values.customFieldEnum1 ||
        !utils.isEmptyHtml(values.assessment_customFieldEnum1))
    ) {
      // Add an additional mutation to create a change record
      variables.note = {
        type: NOTE_TYPE.CHANGE_RECORD,
        noteRelatedObjects: [
          {
            relatedObjectType: "tasks",
            relatedObjectUuid: props.initialValues.uuid
          }
        ],
        text: JSON.stringify({
          text: values.assessment_customFieldEnum1,
          changedField: "customFieldEnum1",
          oldValue: props.initialValues.customFieldEnum1,
          newValue: values.customFieldEnum1
        })
      }
    }
    variables.withNote = !!variables.note
    return API.mutation(edit ? GQL_UPDATE_TASK : GQL_CREATE_TASK, variables)
  }
}

BaseTaskForm.propTypes = {
  initialValues: PropTypes.instanceOf(Task).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  currentUser: PropTypes.instanceOf(Person)
}

BaseTaskForm.defaultProps = {
  title: "",
  edit: false
}

const TaskForm = props => (
  <AppContext.Consumer>
    {context => <BaseTaskForm currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default TaskForm
