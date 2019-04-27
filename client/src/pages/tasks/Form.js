import API, { Settings } from "api"
import {
  OrganizationOverlayRow,
  TaskSimpleOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import CustomDateInput from "components/CustomDateInput"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import { Field, Form, Formik } from "formik"
import { Organization, Person, Task } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button } from "react-bootstrap"
import { withRouter } from "react-router-dom"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"
import DictionaryField from "../../HOC/DictionaryField"

class BaseTaskForm extends Component {
  static propTypes = {
    initialValues: PropTypes.object.isRequired,
    title: PropTypes.string,
    edit: PropTypes.bool,
    currentUser: PropTypes.instanceOf(Person)
  }

  static defaultProps = {
    initialValues: new Task(),
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
  TaskAssessmentField = DictionaryField(Field)

  state = {
    error: null
  }

  render() {
    const { currentUser, edit, title, ...myFormProps } = this.props

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
        searchQuery: true
      }
    }

    const tasksFilters = {
      allTasks: {
        label: "All tasks",
        searchQuery: true,
        queryVars: {}
      }
    }

    return (
      <Formik
        enableReinitialize
        onSubmit={this.onSubmit}
        validationSchema={Task.yupSchema}
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
                  />

                  <AdvancedSingleSelect
                    fieldName="responsibleOrg"
                    fieldLabel={Settings.fields.task.responsibleOrg}
                    placeholder={`Select a responsible organization for this ${
                      Settings.fields.task.shortLabel
                    }`}
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
                      value={values.plannedCompletion}
                      onChange={(value, formattedValue) =>
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
                      value={values.projectedCompletion}
                      onChange={(value, formattedValue) =>
                        setFieldValue("projectedCompletion", value)
                      }
                      onBlur={() =>
                        setFieldTouched("projectedCompletion", true)
                      }
                      widget={<CustomDateInput id="projectedCompletion" />}
                    />
                  )}

                  {Settings.fields.task.customFieldEnum1 && (
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
                    />
                  )}

                  {Settings.fields.task.assessment && (
                    <this.TaskAssessmentField
                      dictProps={Settings.fields.task.assessment}
                      name="assessment"
                      component={FieldHelper.renderInputField}
                    />
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
    this.props.history.push({
      pathname: Task.pathFor(task),
      state: {
        success: "Task saved"
      }
    })
  }

  save = (values, form) => {
    const task = new Task(values)
    task.responsibleOrg = utils.getReference(task.responsibleOrg)
    task.customFieldRef1 = utils.getReference(task.customFieldRef1)
    const { edit } = this.props
    const operation = edit ? "updateTask" : "createTask"
    let graphql = operation + "(task: $task)"
    graphql += edit ? "" : " { uuid }"
    const variables = { task: task }
    const variableDef = "($task: TaskInput!)"
    return API.mutation(graphql, variables, variableDef)
  }
}

const TaskForm = props => (
  <AppContext.Consumer>
    {context => <BaseTaskForm currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default withRouter(TaskForm)
