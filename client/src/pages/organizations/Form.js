import API from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  OrganizationOverlayRow,
  TaskSimpleOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import ApprovalsDefinition from "components/approvals/ApprovalsDefinition"
import {
  CustomFieldsContainer,
  customFieldsJSONString
} from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import NoPaginationTaskTable from "components/NoPaginationTaskTable"
import { jumpToTop } from "components/Page"
import { FastField, Field, Form, Formik } from "formik"
import { Organization, Position, Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"
import utils from "utils"
import DictionaryField from "../../HOC/DictionaryField"

const GQL_CREATE_ORGANIZATION = gql`
  mutation($organization: OrganizationInput!) {
    createOrganization(organization: $organization) {
      uuid
    }
  }
`
const GQL_UPDATE_ORGANIZATION = gql`
  mutation($organization: OrganizationInput!) {
    updateOrganization(organization: $organization)
  }
`

const OrganizationForm = ({ edit, title, initialValues }) => {
  const { currentUser } = useContext(AppContext)
  const history = useHistory()
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
  const typeButtons = [
    {
      id: "typeAdvisorButton",
      value: Organization.TYPE.ADVISOR_ORG,
      label: Settings.fields.advisor.org.name
    },
    {
      id: "typePrincipalButton",
      value: Organization.TYPE.PRINCIPAL_ORG,
      label: Settings.fields.principal.org.name
    }
  ]
  const IdentificationCodeFieldWithLabel = DictionaryField(FastField)
  const LongNameWithLabel = DictionaryField(FastField)

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Organization.yupSchema}
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
        const isAdvisorOrg = values.type === Organization.TYPE.ADVISOR_ORG
        const isPrincipalOrg = values.type === Organization.TYPE.PRINCIPAL_ORG
        const orgSettings = isPrincipalOrg
          ? Settings.fields.principal.org
          : Settings.fields.advisor.org
        const orgSearchQuery = {
          status: Model.STATUS.ACTIVE,
          type: values.type
        }
        // Reset the parentOrg property when changing the organization type
        if (
          values.parentOrg &&
          values.parentOrg.type &&
          values.parentOrg.type !== values.type
        ) {
          values.parentOrg = {}
        }
        const action = (isAdmin || !isPrincipalOrg) && (
          <div>
            <Button
              key="submit"
              bsStyle="primary"
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Organization
            </Button>
          </div>
        )
        const tasksFilters = {
          allTasks: {
            label: `All ${pluralize(Settings.fields.task.shortLabel)}`,
            queryVars: {}
          }
        }
        if (currentUser.position) {
          tasksFilters.assignedToMyOrg = {
            label: "Assigned to my organization",
            queryVars: {
              taskedOrgUuid: currentUser.position.organization.uuid
            }
          }
        }

        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: {}
          }
        }

        const approversFilters = {
          allAdvisorPositions: {
            label: "All advisor positions",
            queryVars: {
              type: [
                Position.TYPE.ADVISOR,
                Position.TYPE.SUPER_USER,
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
          <div>
            <NavigationWarning isBlocking={dirty} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                {!isAdmin ? (
                  <>
                    <FastField
                      name="type"
                      component={FieldHelper.ReadonlyField}
                      humanValue={Organization.humanNameOfType}
                    />
                    <FastField
                      name="parentOrg"
                      component={FieldHelper.ReadonlyField}
                      label={Settings.fields.organization.parentOrg}
                      humanValue={
                        values.parentOrg && (
                          <LinkTo
                            modelType="Organization"
                            model={values.parentOrg}
                          >
                            {Organization.toIdentificationCodeString(
                              values.parentOrg
                            )}
                          </LinkTo>
                        )
                      }
                    />
                    <FastField
                      name="shortName"
                      component={FieldHelper.ReadonlyField}
                      label={Settings.fields.organization.shortName}
                    />
                    <LongNameWithLabel
                      dictProps={orgSettings.longName}
                      name="longName"
                      component={FieldHelper.ReadonlyField}
                    />
                    <FastField
                      name="status"
                      component={FieldHelper.ReadonlyField}
                      humanValue={Organization.humanNameOfStatus}
                    />
                    <IdentificationCodeFieldWithLabel
                      dictProps={orgSettings.identificationCode}
                      name="identificationCode"
                      component={FieldHelper.ReadonlyField}
                    />
                  </>
                ) : (
                  <>
                    <FastField
                      name="type"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      buttons={typeButtons}
                      onChange={value => setFieldValue("type", value)}
                    />
                    <Field
                      name="parentOrg"
                      label={Settings.fields.organization.parentOrg}
                      component={FieldHelper.SpecialField}
                      onChange={value => {
                        // validation will be done by setFieldValue
                        setFieldTouched("parentOrg", true, false) // onBlur doesn't work when selecting an option
                        setFieldValue("parentOrg", value)
                      }}
                      widget={
                        <AdvancedSingleSelect
                          fieldName="parentOrg"
                          placeholder="Search for a higher level organization..."
                          value={values.parentOrg}
                          overlayColumns={["Name"]}
                          overlayRenderRow={OrganizationOverlayRow}
                          filterDefs={organizationFilters}
                          objectType={Organization}
                          fields={Organization.autocompleteQuery}
                          queryParams={orgSearchQuery}
                          valueKey="shortName"
                          addon={ORGANIZATIONS_ICON}
                        />
                      }
                    />
                    <FastField
                      name="shortName"
                      component={FieldHelper.InputField}
                      label={Settings.fields.organization.shortName}
                      placeholder="e.g. EF1.1"
                      disabled={!isAdmin}
                    />
                    <LongNameWithLabel
                      dictProps={orgSettings.longName}
                      name="longName"
                      component={FieldHelper.InputField}
                      disabled={!isAdmin}
                    />
                    <FastField
                      name="status"
                      component={FieldHelper.RadioButtonToggleGroupField}
                      buttons={statusButtons}
                      onChange={value => setFieldValue("status", value)}
                      disabled={!isAdmin}
                    />
                    <IdentificationCodeFieldWithLabel
                      dictProps={orgSettings.identificationCode}
                      name="identificationCode"
                      component={FieldHelper.InputField}
                    />
                  </>
                )}
              </Fieldset>

              {isAdvisorOrg && (
                <div>
                  <ApprovalsDefinition
                    fieldName="planningApprovalSteps"
                    values={values}
                    title="Engagement planning approval process"
                    addButtonLabel="Add a Planning Approval Step"
                    setFieldTouched={setFieldTouched}
                    setFieldValue={setFieldValue}
                    approversFilters={approversFilters}
                  />
                </div>
              )}

              {isAdvisorOrg && (
                <div>
                  <ApprovalsDefinition
                    fieldName="approvalSteps"
                    values={values}
                    title="Report publication approval process"
                    addButtonLabel="Add a Publication Approval Step"
                    setFieldTouched={setFieldTouched}
                    setFieldValue={setFieldValue}
                    approversFilters={approversFilters}
                  />

                  {Organization.isTaskEnabled(values.shortName) && (
                    <Fieldset
                      title={Settings.fields.task.longLabel}
                      className="tasks-selector"
                    >
                      {!isAdmin ? (
                        <NoPaginationTaskTable tasks={values.tasks} />
                      ) : (
                        <FastField
                          name="tasks"
                          label={Settings.fields.task.shortLabel}
                          component={FieldHelper.SpecialField}
                          onChange={value => {
                            // validation will be done by setFieldValue
                            setFieldTouched("tasks", true, false) // onBlur doesn't work when selecting an option
                            setFieldValue("tasks", value)
                          }}
                          widget={
                            <AdvancedMultiSelect
                              fieldName="tasks"
                              placeholder={`Search for ${pluralize(
                                Settings.fields.task.shortLabel
                              )}...`}
                              value={values.tasks}
                              renderSelected={
                                <NoPaginationTaskTable
                                  tasks={values.tasks}
                                  showDelete
                                />
                              }
                              overlayColumns={["Name"]}
                              overlayRenderRow={TaskSimpleOverlayRow}
                              filterDefs={tasksFilters}
                              objectType={Task}
                              queryParams={{ status: Model.STATUS.ACTIVE }}
                              fields={Task.autocompleteQuery}
                              addon={TASKS_ICON}
                            />
                          }
                        />
                      )}
                    </Fieldset>
                  )}
                </div>
              )}
              {Settings.fields.organization.customFields && (
                <Fieldset title="Organization information" id="custom-fields">
                  <CustomFieldsContainer
                    fieldsConfig={Settings.fields.organization.customFields}
                    formikProps={{
                      setFieldTouched,
                      setFieldValue,
                      values,
                      validateForm
                    }}
                  />
                </Fieldset>
              )}

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel}>Cancel</Button>
                </div>
                {(isAdmin || !isPrincipalOrg) && (
                  <div>
                    <Button
                      id="formBottomSubmit"
                      bsStyle="primary"
                      type="button"
                      onClick={submitForm}
                      disabled={isSubmitting}
                    >
                      Save Organization
                    </Button>
                  </div>
                )}
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
    const operation = edit ? "updateOrganization" : "createOrganization"
    const organization = new Organization({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // reset the form to latest values
    // to avoid unsaved changes propmt if it somehow becomes dirty
    form.resetForm({ values, isSubmitting: true })
    if (!edit) {
      history.replace(Organization.pathForEdit(organization))
    }
    history.push(Organization.pathFor(organization), {
      success: "Organization saved"
    })
  }

  function save(values, form) {
    const organization = Organization.filterClientSideFields(
      new Organization(values)
    )
    // strip tasks fields not in data model
    organization.tasks = values.tasks.map(t => utils.getReference(t))
    organization.parentOrg = utils.getReference(organization.parentOrg)
    organization.customFields = customFieldsJSONString(values)
    return API.mutation(
      edit ? GQL_UPDATE_ORGANIZATION : GQL_CREATE_ORGANIZATION,
      { organization }
    ).then()
  }
}

OrganizationForm.propTypes = {
  initialValues: PropTypes.instanceOf(Organization).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool
}

OrganizationForm.defaultProps = {
  title: "",
  edit: false
}

export default OrganizationForm
