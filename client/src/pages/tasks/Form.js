import { gql } from "@apollo/client"
import API from "api"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  OrganizationOverlayRow,
  PositionOverlayRow,
  TaskOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import CustomDateInput from "components/CustomDateInput"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import OrganizationTable from "components/OrganizationTable"
import { jumpToTop } from "components/Page"
import PositionTable from "components/PositionTable"
import RichTextEditor from "components/RichTextEditor"
import { FastField, Field, Form, Formik } from "formik"
import _isEqual from "lodash/isEqual"
import { Organization, Position, Task } from "models"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"
import utils from "utils"

const GQL_CREATE_TASK = gql`
  mutation ($task: TaskInput!) {
    createTask(task: $task) {
      uuid
    }
  }
`
const GQL_UPDATE_TASK = gql`
  mutation ($task: TaskInput!) {
    updateTask(task: $task)
  }
`

const TaskForm = ({ edit, title, initialValues, notesComponent }) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
  const [error, setError] = useState(null)
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

  const taskedOrganizationsFilters = {
    allAdvisorOrganizations: {
      label: "All advisor organizations",
      queryVars: {
        status: Model.STATUS.ACTIVE,
        type: Organization.TYPE.ADVISOR_ORG
      }
    }
  }

  const tasksFilters = {
    allObjectives: {
      label: `All ${Settings.fields.task.longLabel}`,
      queryVars: {}
    }
  }
  const positionsFilters = {
    allAdvisorPositions: {
      label: "All advisor positions",
      queryVars: {
        status: Model.STATUS.ACTIVE,
        type: [
          Position.TYPE.ADVISOR,
          Position.TYPE.SUPERUSER,
          Position.TYPE.ADMINISTRATOR
        ],
        matchPersonName: true
      }
    }
  }

  const approversFilters = {
    allAdvisorPositions: {
      label: "All advisor positions",
      queryVars: {
        type: [
          Position.TYPE.ADVISOR,
          Position.TYPE.SUPERUSER,
          Position.TYPE.ADMINISTRATOR
        ],
        matchPersonName: true
      }
    }
  }
  if (currentUser.position) {
    approversFilters.myColleagues = {
      label: "My colleagues",
      queryVars: {
        matchPersonName: true,
        organizationUuid: currentUser.position.organization.uuid
      }
    }
  }

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Task.yupSchema}
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
        const isAdmin = currentUser && currentUser.isAdmin()
        const disabled = !isAdmin
        const fieldSettings = values.fieldSettings()
        const action = (
          <>
            <Button
              key="submit"
              variant="primary"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save {fieldSettings.shortLabel}
            </Button>
            {notesComponent}
          </>
        )
        return (
          <div>
            <NavigationWarning isBlocking={dirty && !isSubmitting} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={fieldSettings.shortName}
                  name="shortName"
                  component={FieldHelper.InputField}
                  disabled={disabled}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={fieldSettings.longName}
                  name="longName"
                  component={FieldHelper.InputField}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.task.taskedOrganizations}
                  name="taskedOrganizations"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    setFieldTouched("taskedOrganizations", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("taskedOrganizations", value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="taskedOrganizations"
                      value={values.taskedOrganizations}
                      renderSelected={
                        <OrganizationTable
                          organizations={values.taskedOrganizations}
                          showDelete
                        />
                      }
                      overlayColumns={["Name"]}
                      overlayRenderRow={OrganizationOverlayRow}
                      filterDefs={taskedOrganizationsFilters}
                      objectType={Organization}
                      fields={Organization.autocompleteQuery}
                      addon={ORGANIZATIONS_ICON}
                    />
                  }
                />

                {Settings.fields.task.parentTask && (
                  <DictionaryField
                    wrappedComponent={FastField}
                    dictProps={Settings.fields.task.parentTask}
                    name="parentTask"
                    component={FieldHelper.SpecialField}
                    onChange={value => {
                      // validation will be done by setFieldValue
                      setFieldTouched("parentTask", true, false) // onBlur doesn't work when selecting an option
                      setFieldValue("parentTask", value)
                    }}
                    widget={
                      <AdvancedSingleSelect
                        fieldName="parentTask"
                        placeholder={
                          Settings.fields.task.parentTask.placeholder
                        }
                        value={values.parentTask}
                        overlayColumns={["Name"]}
                        overlayRenderRow={TaskOverlayRow}
                        filterDefs={tasksFilters}
                        objectType={Task}
                        fields={Task.autocompleteQuery}
                        valueKey="shortName"
                        queryParams={{}}
                        addon={TASKS_ICON}
                        showRemoveButton={!disabled}
                      />
                    }
                    disabled={disabled}
                  />
                )}

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.task.plannedCompletion}
                  name="plannedCompletion"
                  component={FieldHelper.SpecialField}
                  onChange={value => setFieldValue("plannedCompletion", value)}
                  onBlur={() => setFieldTouched("plannedCompletion")}
                  widget={<CustomDateInput id="plannedCompletion" />}
                  disabled={disabled}
                />

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.task.projectedCompletion}
                  name="projectedCompletion"
                  component={FieldHelper.SpecialField}
                  onChange={value =>
                    setFieldValue("projectedCompletion", value)}
                  onBlur={() => setFieldTouched("projectedCompletion")}
                  widget={<CustomDateInput id="projectedCompletion" />}
                  disabled={disabled}
                />

                {disabled ? (
                  <DictionaryField
                    wrappedComponent={FastField}
                    dictProps={Settings.fields.task.status}
                    name="status"
                    component={FieldHelper.ReadonlyField}
                    humanValue={Position.humanNameOfStatus}
                  />
                ) : (
                  <DictionaryField
                    wrappedComponent={FastField}
                    dictProps={Settings.fields.task.status}
                    name="status"
                    component={FieldHelper.RadioButtonToggleGroupField}
                    buttons={statusButtons}
                    onChange={value => setFieldValue("status", value)}
                  />
                )}

                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.task.description}
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
                      className="description"
                      placeholder={
                        Settings.fields.task.description?.placeholder
                      }
                    />
                  }
                />
              </Fieldset>

              <Fieldset
                title={Settings.fields.task.responsiblePositions?.label}
              >
                <DictionaryField
                  wrappedComponent={FastField}
                  dictProps={Settings.fields.task.responsiblePositions}
                  name="responsiblePositions"
                  component={FieldHelper.SpecialField}
                  onChange={value => {
                    // validation will be done by setFieldValue
                    value = value.map(position =>
                      Position.filterClientSideFields(position)
                    )
                    setFieldTouched("responsiblePositions", true, false) // onBlur doesn't work when selecting an option
                    setFieldValue("responsiblePositions", value)
                  }}
                  widget={
                    <AdvancedMultiSelect
                      fieldName="responsiblePositions"
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
                      objectType={Position}
                      fields={Position.autocompleteQuery}
                      addon={POSITIONS_ICON}
                    />
                  }
                />
              </Fieldset>

              {Settings.fields.task.customFields && !disabled && (
                <Fieldset
                  title={`${fieldSettings.shortLabel} information`}
                  id="custom-fields"
                >
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.task.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}

              <ApprovalsDefinition
                fieldName="planningApprovalSteps"
                values={values}
                title="Engagement planning approval process"
                restrictedApprovalLabel="Restrict to approvers descending from the same tasked organization as the report's primary advisor"
                addButtonLabel="Add a Planning Approval Step"
                setFieldTouched={setFieldTouched}
                setFieldValue={setFieldValue}
                approversFilters={approversFilters}
              />

              <ApprovalsDefinition
                fieldName="approvalSteps"
                values={values}
                title="Report publication approval process"
                restrictedApprovalLabel="Restrict to approvers descending from the same tasked organization as the report's primary advisor"
                addButtonLabel="Add a Publication Approval Step"
                setFieldTouched={setFieldTouched}
                setFieldValue={setFieldValue}
                approversFilters={approversFilters}
              />

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
                    Save {fieldSettings.shortLabel}
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
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const operation = edit ? "updateTask" : "createTask"
    const task = new Task({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes prompt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (!edit) {
      navigate(Task.pathForEdit(task), { replace: true })
    }
    navigate(Task.pathFor(task), {
      state: { success: "Task saved" }
    })
  }

  function save(values, form) {
    const task = Task.filterClientSideFields(new Task(values))
    task.parentTask = utils.getReference(task.parentTask)
    task.customFields = customFieldsJSONString(values)
    task.taskedOrganizations = task.taskedOrganizations.map(a =>
      utils.getReference(a)
    )

    return API.mutation(edit ? GQL_UPDATE_TASK : GQL_CREATE_TASK, { task })
  }
}

TaskForm.propTypes = {
  initialValues: PropTypes.instanceOf(Task).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  notesComponent: PropTypes.node
}

TaskForm.defaultProps = {
  title: "",
  edit: false
}

export default TaskForm
