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
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import { GRAPHQL_NOTE_FIELDS, NOTE_TYPE } from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop, routerRelatedPropTypes } from "components/Page"
import PositionTable from "components/PositionTable"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { Organization, Person, Position, Task } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button } from "react-bootstrap"
import { withRouter } from "react-router-dom"
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

class BaseTaskForm extends Component {
  static propTypes = {
    initialValues: PropTypes.instanceOf(Task).isRequired,
    title: PropTypes.string,
    edit: PropTypes.bool,
    currentUser: PropTypes.instanceOf(Person),
    ...routerRelatedPropTypes
  }

  static defaultProps = {
    title: "",
    edit: false
  }

  statusButtons = [
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

  ShortNameField = DictionaryField(Field)
  LongNameField = DictionaryField(Field)
  TaskCustomFieldRef1 = DictionaryField(AdvancedSingleSelect)
  TaskCustomField = DictionaryField(Field)
  PlannedCompletionField = DictionaryField(Field)
  ProjectedCompletionField = DictionaryField(Field)
  TaskCustomFieldEnum1 = DictionaryField(Field)
  TaskCustomFieldEnum2 = DictionaryField(Field)
  ResponsiblePositonsMultiSelect = DictionaryField(AdvancedMultiSelect)
  state = {
    error: null
  }

  render() {
    const {
      currentUser,
      edit,
      title,
      initialValues,
      ...myFormProps
    } = this.props
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
        onSubmit={this.onSubmit}
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
              <Messages error={this.state.error} />
              <Form className="form-horizontal" method="post">
                <Fieldset title={title} action={action} />
                <Fieldset>
                  <this.ShortNameField
                    dictProps={Settings.fields.task.shortName}
                    name="shortName"
                    component={FieldHelper.renderInputField}
                  />

                  <this.LongNameField
                    dictProps={Settings.fields.task.longName}
                    name="longName"
                    component={FieldHelper.renderInputField}
                  />

                  <Field
                    name="status"
                    component={FieldHelper.renderButtonToggleGroup}
                    buttons={this.statusButtons}
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

                  <this.ResponsiblePositonsMultiSelect
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
                      setFieldValue("responsiblePositions", value)
                    }
                    objectType={Position}
                    fields={Position.autocompleteQuery}
                    addon={POSITIONS_ICON}
                  />

                  {Settings.fields.task.customFieldRef1 && (
                    <this.TaskCustomFieldRef1
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
                      onChange={value =>
                        setFieldValue("customFieldRef1", value)
                      }
                      objectType={Task}
                      fields={Task.autocompleteQuery}
                      valueKey="shortName"
                      queryParams={{}}
                      addon={TASKS_ICON}
                    />
                  )}

                  <this.TaskCustomField
                    dictProps={Settings.fields.task.customField}
                    name="customField"
                    component={FieldHelper.renderInputField}
                  />

                  {Settings.fields.task.plannedCompletion && (
                    <this.PlannedCompletionField
                      dictProps={Settings.fields.task.plannedCompletion}
                      name="plannedCompletion"
                      component={FieldHelper.renderSpecialField}
                      onChange={value =>
                        setFieldValue("plannedCompletion", value)
                      }
                      onBlur={() => setFieldTouched("plannedCompletion", true)}
                      widget={<CustomDateInput id="plannedCompletion" />}
                    />
                  )}

                  {Settings.fields.task.projectedCompletion && (
                    <this.ProjectedCompletionField
                      dictProps={Settings.fields.task.projectedCompletion}
                      name="projectedCompletion"
                      component={FieldHelper.renderSpecialField}
                      onChange={value =>
                        setFieldValue("projectedCompletion", value)
                      }
                      onBlur={() =>
                        setFieldTouched("projectedCompletion", true)
                      }
                      widget={<CustomDateInput id="projectedCompletion" />}
                    />
                  )}

                  {Settings.fields.task.customFieldEnum1 && (
                    <React.Fragment>
                      <this.TaskCustomFieldEnum1
                        dictProps={Object.without(
                          Settings.fields.task.customFieldEnum1,
                          "enum"
                        )}
                        name="customFieldEnum1"
                        component={FieldHelper.renderButtonToggleGroup}
                        buttons={this.customEnumButtons(
                          Settings.fields.task.customFieldEnum1.enum
                        )}
                        onChange={value =>
                          setFieldValue("customFieldEnum1", value)
                        }
                      />
                      {edit && (
                        <Field
                          name="assessment_customFieldEnum1"
                          label={`Assessment of ${Settings.fields.task.customFieldEnum1.label}`}
                          component={FieldHelper.renderSpecialField}
                          onChange={value =>
                            setFieldValue("assessment_customFieldEnum1", value)
                          }
                          widget={
                            <RichTextEditor
                              className="textField"
                              onHandleBlur={() =>
                                setFieldTouched(
                                  "assessment_customFieldEnum1",
                                  true
                                )
                              }
                            />
                          }
                        />
                      )}
                    </React.Fragment>
                  )}

                  {Settings.fields.task.customFieldEnum2 && (
                    <this.TaskCustomFieldEnum2
                      dictProps={Object.without(
                        Settings.fields.task.customFieldEnum2,
                        "enum"
                      )}
                      name="customFieldEnum2"
                      component={FieldHelper.renderButtonToggleGroup}
                      buttons={this.customEnumButtons(
                        Settings.fields.task.customFieldEnum2.enum
                      )}
                      onChange={value =>
                        setFieldValue("customFieldEnum2", value)
                      }
                    />
                  )}
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
  }

  customEnumButtons = list => {
    const buttons = []
    for (const key in list) {
      if (list.hasOwnProperty(key)) {
        buttons.push({
          id: key,
          value: key,
          label: list[key].label,
          color: list[key].color
        })
      }
    }
    return buttons
  }

  onCancel = () => {
    this.props.history.goBack()
  }

  onSubmit = (values, form) => {
    return this.save(values, form)
      .then(response => this.onSubmitSuccess(response, values, form))
      .catch(error => {
        this.setState({ error }, () => {
          form.setSubmitting(false)
          jumpToTop()
        })
      })
  }

  onSubmitSuccess = (response, values, form) => {
    const { edit } = this.props
    const operation = edit ? "updateTask" : "createTask"
    const task = new Task({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : this.props.initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    this.props.history.replace(Task.pathForEdit(task))
    if (!edit) {
      this.props.history.replace(Task.pathForEdit(task), {
        noRender: true
      })
    }
    this.props.history.push({
      pathname: Task.pathFor(task),
      state: {
        success: "Task saved"
      }
    })
  }

  save = (values, form) => {
    const task = Object.without(
      new Task(values),
      "notes",
      "assessment_customFieldEnum1"
    )
    task.responsibleOrg = utils.getReference(task.responsibleOrg)
    task.customFieldRef1 = utils.getReference(task.customFieldRef1)
    const { edit } = this.props
    const variables = { task: task }
    if (
      edit &&
      (this.props.initialValues.customFieldEnum1 !== values.customFieldEnum1 ||
        !utils.isEmptyHtml(values.assessment_customFieldEnum1))
    ) {
      // Add an additional mutation to create a change record
      variables.note = {
        type: NOTE_TYPE.CHANGE_RECORD,
        noteRelatedObjects: [
          {
            relatedObjectType: "tasks",
            relatedObjectUuid: this.props.initialValues.uuid
          }
        ],
        text: JSON.stringify({
          text: values.assessment_customFieldEnum1,
          changedField: "customFieldEnum1",
          oldValue: this.props.initialValues.customFieldEnum1,
          newValue: values.customFieldEnum1
        })
      }
    }
    variables.withNote = !!variables.note
    return API.mutation(edit ? GQL_UPDATE_TASK : GQL_CREATE_TASK, variables)
  }
}

const TaskForm = props => (
  <AppContext.Consumer>
    {context => <BaseTaskForm currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default withRouter(TaskForm)
